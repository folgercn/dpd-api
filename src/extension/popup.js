const DEFAULT_API_URL = 'https://dpdapi.sunnywifi.cn/api';

const pasteArea = document.getElementById('pasteArea');
const apiUrlInput = document.getElementById('apiUrl');
const parseBtn = document.getElementById('parseBtn');
const fillBtn = document.getElementById('fillBtn');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');

// 新增 UI 元素
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const licenseKeyInput = document.getElementById('licenseKey');
const activateBtn = document.getElementById('activateBtn');
const authStatus = document.getElementById('authStatus');
const versionTag = document.getElementById('versionTag');
const mainContent = document.getElementById('mainContent');
const lockOverlay = document.getElementById('lockOverlay');

let parsedShipments = [];
let selectedIndex = 0;
let isAuthorized = false;

function setStatus(message, type = '') {
  statusEl.className = type;
  statusEl.textContent = message;
}

function setBusy(isBusy) {
  parseBtn.disabled = isBusy;
  fillBtn.disabled = isBusy || parsedShipments.length === 0;
  if (isBusy) {
    parseBtn.classList.add('loading-btn');
  } else {
    parseBtn.classList.remove('loading-btn');
  }
}

// 辅助函数：保存状态到存储
async function saveState() {
  await chrome.storage.local.set({
    parsedShipments,
    selectedIndex,
    lastUpdate: Date.now()
  });
}

function renderPreview() {
  previewEl.innerHTML = '';
  fillBtn.disabled = parsedShipments.length === 0;

  parsedShipments.forEach((shipment, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `shipment${index === selectedIndex ? ' selected' : ''}`;
    item.dataset.index = String(index);
    item.onclick = () => {
      selectedIndex = index;
      renderPreview();
      saveState();
    };
    item.innerHTML = `
      <strong>${escapeHtml(shipment.recipientName || shipment.company || `地址 ${index + 1}`)}</strong>
      <span>${escapeHtml([shipment.addressLine1, shipment.postalCode, shipment.city, shipment.countryCode].filter(Boolean).join(', '))}</span>
      <span>${escapeHtml([shipment.phone, `${shipment.weightKg || 1}kg`, shipment.serviceType].filter(Boolean).join(' · '))}</span>
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

  // --- 严格字段校验开始 ---
  const lines = text.split('\n');
  if (lines.length < 1) {
    throw new Error('内容为空，请重新粘贴');
  }

  const expectedHeaders = [
    "发件人姓名", "发件人电话", "发件人国家", "发件人城市", "发件人地址", "发件人邮编",
    "收件人姓名", "收件人公司", "收件人电话", "收件人国家", "收件人城市", "收件人地址",
    "收件人地址二", "收件人邮编", "客户订单号", "SKU1", "重量(kg)", "数量1"
  ];

  const headers = lines[0].split('\t').map(h => h.trim());
  
  // 校验列数
  if (headers.length !== expectedHeaders.length) {
    throw new Error(`表格列数不匹配！预期 ${expectedHeaders.length} 列，实际检测到 ${headers.length} 列。\n请确保您是从样本 Excel 中完整复制的。`);
  }

  // 校验关键表头内容 (检查前 5 个和后 3 个字段是否匹配)
  const criticalIndexes = [0, 1, 2, 3, 4, 15, 16, 17];
  for (let idx of criticalIndexes) {
    if (headers[idx] !== expectedHeaders[idx]) {
      throw new Error(`表格字段顺序或名称不正确！\n第 ${idx + 1} 列应该是 "${expectedHeaders[idx]}"，但检测到是 "${headers[idx]}"`);
    }
  }
  // --- 严格字段校验结束 ---

  await chrome.storage.sync.set({ apiUrl });
  setStatus('正在解析地址...', 'loading');
  setBusy(true);

  const startTime = Date.now();
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getLicenseKey()}`
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    parsedShipments = shipments;
    selectedIndex = 0;
    renderPreview();
    await saveState();
    setStatus(`已解析 ${shipments.length} 条地址 (耗时 ${duration}s)，选择后填入当前页`, 'success');
  } finally {
    setBusy(false);
  }
}

async function fillSelectedShipment() {
  if (parsedShipments.length === 0) {
    throw new Error('请先解析地址');
  }

  const shipment = parsedShipments[selectedIndex];
  const isReturn = shipment.weightKg > 20 || shipment.serviceType === 'RETURN';
  const targetUrl = isReturn ? PAGES.RETURN : PAGES.SHIPMENT;

  const tab = await getActiveTab();
  if (!tab?.id) throw new Error('未找到活动标签页');

  // If already on the right page, just fill
  if (tab.url && tab.url.startsWith(targetUrl)) {
    await executeFill(tab.id, shipment);
    return;
  }

  // Otherwise, redirect and wait
  setStatus('正在跳转并自动填单...', 'loading');
  setBusy(true);

  // 设置自动填单标志，供 content.js 加载后执行
  await chrome.storage.local.set({ 
    pendingShipment: shipment,
    pendingTarget: targetUrl
  });

  await chrome.tabs.update(tab.id, { url: targetUrl });
  // 提示用户跳转后会自动填写
  setStatus('页面正在跳转，完成后将自动填单...', 'success');
  
  // 对于大部分浏览器，此时弹窗会关闭，由 content.js 接手
  // 如果弹窗没关闭，我们依然可以留着提示
}

async function executeFill(tabId, shipment) {
  setStatus('正在填入 DPD 表单...', 'loading');
  setBusy(true);

  const response = await sendFillMessage(tabId, {
    action: 'FILL_DPD_FORM',
    shipment: shipment,
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
    // If content script not yet injected (common after redirect), inject it
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

// 设置面板切换
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('active');
});

// 激活逻辑
async function checkAuth(key) {
  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
  // 更加智能的 URL 拼接
  const verifyUrl = apiUrl.endsWith('/api') 
    ? `${apiUrl}/verify` 
    : apiUrl.replace(/\/parse-address$/, '/verify');

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
    authStatus.textContent = '✅ 已激活';
    authStatus.style.color = '#166534';
    await chrome.storage.sync.set({ licenseKey: key });
    updateUIForAuth();
  } else {
    authStatus.textContent = '❌ ' + result.message;
    authStatus.style.color = '#dc3545';
  }
});

function updateUIForAuth() {
  if (isAuthorized) {
    mainContent.style.display = 'block';
    lockOverlay.style.display = 'none';
  } else {
    mainContent.style.display = 'none';
    lockOverlay.style.display = 'block';
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const manifest = chrome.runtime.getManifest();
  versionTag.textContent = `v${manifest.version}`;
  
  // 检查更新
  checkUpdates();

  // 绑定设置面板切换
  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
  });

  // 绑定关闭更新提示
  document.getElementById('closeUpdate').addEventListener('click', () => {
    document.getElementById('updateBanner').style.display = 'none';
  });

  // 1. 加载存储的解析结果 (持久化)
  chrome.storage.local.get(['parsedShipments', 'selectedIndex'], (data) => {
    if (data.parsedShipments && data.parsedShipments.length > 0) {
      parsedShipments = data.parsedShipments;
      selectedIndex = data.selectedIndex || 0;
      renderPreview();
      setStatus(`已恢复上次解析的 ${parsedShipments.length} 条地址`, 'success');
    }
  });

  // 2. 加载存储的配置
  chrome.storage.sync.get({ 
    apiUrl: DEFAULT_API_URL,
    licenseKey: ''
  }, async (items) => {
    apiUrlInput.value = items.apiUrl;
    licenseKeyInput.value = items.licenseKey;
    
    if (items.licenseKey) {
      authStatus.textContent = '正在验证激活状态...';
      const result = await checkAuth(items.licenseKey);
      if (result.success) {
        isAuthorized = true;
        authStatus.textContent = '✅ 已激活';
        authStatus.style.color = '#166534';
      } else {
        isAuthorized = false;
        authStatus.textContent = '❌ ' + (result.message || '激活已失效');
        authStatus.style.color = '#dc3545';
        // 自动展开设置面板，提醒用户
        settingsPanel.classList.add('active');
      }
    }
    updateUIForAuth();
  });
});

/**
 * 检查版本更新
 */
async function checkUpdates() {
  try {
    const currentVersion = chrome.runtime.getManifest().version;
    const response = await fetch('https://folgercn.github.io/dpd-api/version.json', { cache: 'no-cache' });
    if (!response.ok) return;
    
    const data = await response.json();
    const latestVersion = data.version;
    
    // 比较版本号
    if (isNewerVersion(latestVersion, currentVersion)) {
      const banner = document.getElementById('updateBanner');
      const text = document.getElementById('updateText');
      if (banner && text) {
        text.innerText = `发现新版本 v${latestVersion}!`;
        banner.style.display = 'flex';
        // 增加高亮样式
        const vTag = document.getElementById('versionTag');
        if (vTag) vTag.style.background = '#dcfce7';
      }
    }
  } catch (error) {
    console.error('检查更新失败:', error);
  }
}

/**
 * 比较版本号 (1.0.15 > 1.0.14)
 */
function isNewerVersion(latest, current) {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}
