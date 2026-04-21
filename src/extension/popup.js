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

async function getActiveDpdTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error('未找到当前活动标签页');
  }

  const allowedPages = [
    'https://business.dpd.de/retouren/retoure-beauftragen.aspx',
    'https://business.dpd.de/auftragsstart/auftrag-starten.aspx',
  ];

  if (!allowedPages.some((page) => tab.url.startsWith(page))) {
    throw new Error('请先打开 DPD 20kg 以下或 20kg 以上下单页面');
  }

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

  const tab = await getActiveDpdTab();
  setStatus('正在填入 DPD 表单...', 'loading');
  setBusy(true);

  const response = await sendFillMessage(tab.id, {
    action: 'FILL_DPD_FORM',
    shipment: parsedShipments[selectedIndex],
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
    if (!String(error.message || '').includes('Receiving end does not exist')) {
      throw error;
    }

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
