const DEFAULT_API_URL = 'https://dpdapi.sunnywifi.cn/api/parse-address';

const pasteArea = document.getElementById('pasteArea');
const apiUrlInput = document.getElementById('apiUrl');
const parseBtn = document.getElementById('parseBtn');
const fillBtn = document.getElementById('fillBtn');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const licenseKeyInput = document.getElementById('licenseKey');
const activateBtn = document.getElementById('activateBtn');
const authStatus = document.getElementById('authStatus');
const versionTag = document.getElementById('versionTag');
const mainContent = document.getElementById('mainContent');
const lockOverlay = document.getElementById('lockOverlay');
const updateBanner = document.getElementById('updateBanner');
const updateText = document.getElementById('updateText');
const updateLink = document.getElementById('updateLink');
const closeUpdate = document.getElementById('closeUpdate');
const POPUP_STATE_KEY = 'popupState';

let parsedShipments = [];
let selectedIndex = 0;
let isAuthorized = false;
const INVALID_SOURCE_MARKERS = [
  'EXPO Service GmbH',
  'Hua Zhang',
  '15257038155',
];

function setStatus(message, type = '') {
  statusEl.className = type;
  statusEl.textContent = message;
}

function setBusy(isBusy) {
  parseBtn.disabled = isBusy;
  fillBtn.disabled = isBusy || parsedShipments.length === 0;
}

function isRemoteVersionNewer(remoteVersion, localVersion) {
  const remote = String(remoteVersion || '').split('.').map(Number);
  const local = String(localVersion || '').split('.').map(Number);
  const maxLength = Math.max(remote.length, local.length, 3);

  for (let i = 0; i < maxLength; i += 1) {
    const remotePart = remote[i] || 0;
    const localPart = local[i] || 0;
    if (remotePart > localPart) return true;
    if (remotePart < localPart) return false;
  }

  return false;
}

async function checkUpdates(currentVersion) {
  try {
    const response = await fetch('https://folgercn.github.io/dpd-api/version.json', { cache: 'no-cache' });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    if (!data?.version || !isRemoteVersionNewer(data.version, currentVersion)) {
      return;
    }

    updateText.textContent = `发现新版本 v${data.version}`;
    updateLink.href = data.downloadUrl || data.url || 'https://github.com/folgercn/dpd-api/releases/latest';
    updateBanner.style.display = 'flex';
    closeUpdate.onclick = () => {
      updateBanner.style.display = 'none';
    };
  } catch {
    // ignore update check failures
  }
}

async function savePopupState() {
  await chrome.storage.local.set({
    [POPUP_STATE_KEY]: {
      pasteText: pasteArea.value,
      parsedShipments,
      selectedIndex,
      savedAt: Date.now(),
    },
  });
}

async function restorePopupState() {
  const { [POPUP_STATE_KEY]: popupState } = await chrome.storage.local.get(POPUP_STATE_KEY);
  if (!popupState) {
    return;
  }

  pasteArea.value = popupState.pasteText || '';
  parsedShipments = Array.isArray(popupState.parsedShipments) ? popupState.parsedShipments : [];
  selectedIndex = Number.isInteger(popupState.selectedIndex) ? popupState.selectedIndex : 0;

  if (selectedIndex < 0 || selectedIndex >= parsedShipments.length) {
    selectedIndex = 0;
  }

  if (parsedShipments.length > 0) {
    renderPreview();
    setStatus(`已恢复 ${parsedShipments.length} 条上次解析结果`, 'success');
  }
}

function renderPreview() {
  previewEl.innerHTML = '';
  fillBtn.disabled = parsedShipments.length === 0;

  parsedShipments.forEach((shipment, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `shipment${index === selectedIndex ? ' selected' : ''}`;
    item.dataset.index = String(index);
    const weightLabel = Number(shipment.weightKg) > 0 ? `${shipment.weightKg}kg` : '未识别重量';
    const rows = [
      ['姓名', shipment.recipientName],
      ['公司', shipment.company],
      ['名字', shipment.firstName],
      ['姓氏', shipment.lastName],
      ['SKU', shipment.sku],
      ['数量', shipment.quantity],
      ['街道', shipment.street],
      ['门牌', shipment.houseNumber],
      ['地址1', shipment.addressLine1],
      ['地址2', shipment.addressLine2],
      ['邮编', shipment.postalCode],
      ['城市', shipment.city],
      ['国家', shipment.countryCode],
      ['电话', shipment.phone],
      ['邮箱', shipment.email],
      ['参考号', shipment.reference],
      ['重量', weightLabel],
      ['类型', shipment.serviceType],
    ].filter(([, value]) => value !== undefined && value !== null && value !== '');

    item.innerHTML = `
      <strong>${escapeHtml(shipment.recipientName || shipment.company || `地址 ${index + 1}`)}</strong>
      <div class="fields-grid">
        ${rows.map(([label, value]) => `
          <div class="field-row">
            <div class="field-label">${escapeHtml(label)}</div>
            <div class="field-value">${escapeHtml(value)}</div>
          </div>
        `).join('')}
      </div>
    `;
    previewEl.appendChild(item);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const PAGES = {
  SHIPMENT: 'https://business.dpd.de/auftragsstart/auftrag-starten.aspx',
  RETURN: 'https://business.dpd.de/retouren/retoure-beauftragen.aspx',
};

function getPageKind(url) {
  try {
    const pathname = new URL(url).pathname;
    if (pathname.includes('/auftragsstart/auftrag-starten.aspx')) {
      return 'SHIPMENT';
    }
    if (pathname.includes('/retouren/retoure-beauftragen.aspx')) {
      return 'RETURN';
    }
  } catch {
    return '';
  }

  return '';
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function parseAddressText() {
  if (!isAuthorized) {
    throw new Error('请先激活插件');
  }

  const text = pasteArea.value.trim();
  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;

  if (!text) {
    throw new Error('请先粘贴 Excel 表格内容');
  }

  const hasInvalidSourceMarker = INVALID_SOURCE_MARKERS.some((marker) => text.includes(marker));
  if (hasInvalidSourceMarker) {
    throw new Error('数据源有问题，请重新复制');
  }

  await chrome.storage.sync.set({ apiUrl });
  setStatus('正在解析地址...', 'loading');
  setBusy(true);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getLicenseKey()}`,
    },
    body: JSON.stringify({ text }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || '地址解析失败');
  }

  const shipments = Array.isArray(payload) ? payload : payload.shipments;
  if (!Array.isArray(shipments) || shipments.length === 0) {
    throw new Error('AI 未识别出可填入的地址');
  }

  parsedShipments = shipments;
  selectedIndex = 0;
  renderPreview();
  await savePopupState();
  setStatus(`已解析 ${shipments.length} 条地址，选择一条后可填入当前页`, 'success');
}

async function fillSelectedShipment() {
  if (parsedShipments.length === 0) {
    throw new Error('请先解析地址');
  }

  const shipment = parsedShipments[selectedIndex];
  const weightKg = Number(shipment.weightKg) || 0;
  const hasWeight = weightKg > 0;
  const isReturn = hasWeight && (shipment.serviceType === 'RETURN' || weightKg > 20);
  const targetUrl = isReturn ? PAGES.RETURN : PAGES.SHIPMENT;
  const targetPageKind = isReturn ? 'RETURN' : 'SHIPMENT';

  const tab = await getActiveTab();
  if (!tab?.id) {
    throw new Error('未找到活动标签页');
  }
  const currentPageKind = getPageKind(tab.url || '');

  if (!hasWeight) {
    setStatus('未识别到重量，将填入当前页面', 'loading');
    await savePopupState();
    await executeFill(tab.id, shipment);
    return;
  }

  if (currentPageKind && currentPageKind === targetPageKind) {
    setStatus('已在匹配页面，直接填入当前页面', 'loading');
    await savePopupState();
    await executeFill(tab.id, shipment);
    return;
  }

  throw new Error(
    isReturn
      ? `当前数据应在退货页填写，请先打开 ${PAGES.RETURN}`
      : `当前数据应在发货页填写，请先打开 ${PAGES.SHIPMENT}`
  );
}

async function executeFill(tabId, shipment) {
  setStatus('正在填入 DPD 表单...', 'loading');
  setBusy(true);

  const sanitizedShipment = { ...shipment };
  delete sanitizedShipment.sourceRow;

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js'],
  });

  const response = await sendFillMessage(tabId, {
    action: 'FILL_DPD_FORM_V2',
    shipment: sanitizedShipment,
  });

  if (!response?.success) {
    throw new Error(response?.error || '填表失败，请刷新 DPD 页面后重试');
  }

  const missed = response.missed?.length ? `，未匹配字段：${response.missed.join('、')}` : '';
  setStatus(`已填入 ${response.filledCount} 个字段${missed}`, response.missed?.length ? 'loading' : 'success');
}

async function sendFillMessage(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });

    return chrome.tabs.sendMessage(tabId, message);
  }
}

parseBtn.addEventListener('click', async () => {
  try {
    await parseAddressText();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    setBusy(false);
  }
});

fillBtn.addEventListener('click', async () => {
  try {
    await fillSelectedShipment();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    setBusy(false);
  }
});

settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('active');
});

async function checkAuth(key) {
  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
  const baseApi = apiUrl.substring(0, apiUrl.lastIndexOf('/'));
  const verifyUrl = `${baseApi}/auth/verify`;

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, message: '无法连接到服务器' };
  }
}

async function getLicenseKey() {
  const items = await chrome.storage.sync.get({ licenseKey: '' });
  return items.licenseKey;
}

activateBtn.addEventListener('click', async () => {
  const key = licenseKeyInput.value.trim();
  const result = await checkAuth(key);

  if (result.success) {
    isAuthorized = true;
    authStatus.textContent = '已激活';
    authStatus.style.color = '#166534';
    await chrome.storage.sync.set({ licenseKey: key });
    updateUIForAuth();
  } else {
    authStatus.textContent = result.message ? `激活失败：${result.message}` : '激活失败';
    authStatus.style.color = '#dc3545';
  }
});

function updateUIForAuth() {
  if (isAuthorized) {
    lockOverlay.style.display = 'none';
    mainContent.style.display = 'block';
  } else {
    lockOverlay.style.display = 'block';
    mainContent.style.display = 'none';
  }
}

previewEl.addEventListener('click', (event) => {
  const button = event.target.closest('.shipment');
  if (!button) {
    return;
  }

  selectedIndex = Number(button.dataset.index || 0);
  renderPreview();
  savePopupState().catch(() => {});
});

document.addEventListener('DOMContentLoaded', async () => {
  const manifest = chrome.runtime.getManifest();
  versionTag.textContent = `v${manifest.version}`;
  await checkUpdates(manifest.version);

  const { apiUrl = DEFAULT_API_URL, licenseKey = '' } = await chrome.storage.sync.get({
    apiUrl: DEFAULT_API_URL,
    licenseKey: '',
  });

  apiUrlInput.value = apiUrl;
  licenseKeyInput.value = licenseKey;

  if (licenseKey) {
    const result = await checkAuth(licenseKey);
    isAuthorized = Boolean(result.success);
    authStatus.textContent = result.success ? '已激活' : (result.message || '激活失效');
    authStatus.style.color = result.success ? '#166534' : '#dc3545';
  }

  await restorePopupState();
  pasteArea.addEventListener('input', () => {
    savePopupState().catch(() => {});
  });
  updateUIForAuth();
  setBusy(false);
});
