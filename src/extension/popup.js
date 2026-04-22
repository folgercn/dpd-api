const DEFAULT_API_URL = 'http://localhost:3000/api/parse-address';

const pasteArea = document.getElementById('pasteArea');
const apiUrlInput = document.getElementById('apiUrl');
const parseBtn = document.getElementById('parseBtn');
const fillBtn = document.getElementById('fillBtn');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');

let parsedShipments = [];
let selectedIndex = 0;

function setStatus(message, type = '') {
  statusEl.className = type;
  statusEl.textContent = message;
}

function setBusy(isBusy) {
  parseBtn.disabled = isBusy;
  fillBtn.disabled = isBusy || parsedShipments.length === 0;
}

function renderPreview() {
  previewEl.innerHTML = '';
  fillBtn.disabled = parsedShipments.length === 0;

  parsedShipments.forEach((shipment, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `shipment${index === selectedIndex ? ' selected' : ''}`;
    item.dataset.index = String(index);
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
  const text = pasteArea.value.trim();
  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;

  if (!text) {
    throw new Error('请先粘贴 Excel 表格内容');
  }

  await chrome.storage.sync.set({ apiUrl });
  setStatus('正在解析地址...', 'loading');
  setBusy(true);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  setStatus(`已解析 ${shipments.length} 条地址，选择一条后可填入当前页`, 'success');
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
  setStatus('正在跳转到匹配的 DPD 页面...', 'loading');
  setBusy(true);
  await chrome.tabs.update(tab.id, { url: targetUrl });

  // Wait for the page to load
  let attempts = 0;
  const checkInterval = setInterval(async () => {
    attempts++;
    const currentTab = await chrome.tabs.get(tab.id);

    if (currentTab.status === 'complete' && currentTab.url.startsWith(targetUrl)) {
      clearInterval(checkInterval);
      // Small delay to ensure content script is ready
      setTimeout(async () => {
        try {
          await executeFill(tab.id, shipment);
        } catch (error) {
          setStatus(error.message, 'error');
        } finally {
          setBusy(false);
        }
      }, 1500);
    } else if (attempts > 20) {
      // 10 seconds timeout
      clearInterval(checkInterval);
      setStatus('跳转超时，请手动刷新页面后重试', 'error');
      setBusy(false);
    }
  }, 500);
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

previewEl.addEventListener('click', (event) => {
  const item = event.target.closest('.shipment');
  if (!item) return;

  selectedIndex = Number(item.dataset.index || 0);
  renderPreview();
});

chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL }, (items) => {
  apiUrlInput.value = items.apiUrl;
});
