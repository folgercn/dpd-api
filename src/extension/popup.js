const pasteArea = document.getElementById('pasteArea');
const fillBtn = document.getElementById('fillBtn');
const statusEl = document.getElementById('status');
const versionTag = document.getElementById('versionTag');

let parsedShipments = [];
let selectedIndex = 0;

// 设置状态信息
function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = 'status ' + type;
  statusEl.style.display = message ? 'block' : 'none';
}

function setBusy(isBusy) {
  fillBtn.disabled = isBusy;
  if (isBusy) {
    fillBtn.classList.add('loading-btn');
  } else {
    fillBtn.classList.remove('loading-btn');
  }
}

async function parseAddressText() {
  const text = pasteArea.value.trim();
  if (!text) {
    throw new Error('请先粘贴 Excel 表格内容');
  }

  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 1) {
    throw new Error('内容为空，请重新粘贴');
  }

  // 改进的列数检测：支持 Tab 同时也支持多个空格（防止从聊天工具复制时丢失 Tab）
  const detectColumns = (line) => {
    let cols = line.split('\t');
    if (cols.length !== 18) {
      // 尝试用 2 个及以上空格切割
      const spaceCols = line.split(/ {2,}/);
      if (spaceCols.length === 18) cols = spaceCols;
    }
    return cols.map(c => c.trim());
  };

  const firstRowFields = detectColumns(lines[0]);
  if (firstRowFields.length !== 18) {
    throw new Error(`格式错误：预期 18 列，实际检测到 ${firstRowFields.length} 列。建议直接从 Excel 复制。`);
  }

  setStatus('正在解析...', 'loading');
  setBusy(true);

  try {
    const results = [];
    for (const line of lines) {
      const col = detectColumns(line);
      if (col.length < 18) continue;

      // 同时提取发件人和收件人信息
      const sender = {
        recipientName: col[0],
        phone: col[1],
        countryCode: col[2],
        city: col[3],
        street: col[4],
        postalCode: col[5]
      };

      const recipient = {
        recipientName: col[6],
        company: col[7],
        phone: col[8],
        countryCode: col[9],
        city: col[10],
        street: col[11],
        addressLine2: col[12],
        postalCode: col[13]
      };

      const shipment = {
        sender,
        recipient,
        reference: `${col[14]} / ${col[15]}`,
        weightKg: parseFloat(col[16]) || 1,
        // 修正：> 20kg 为发货(SHIPMENT)，<= 20kg 为退货(RETURN)
        serviceType: (parseFloat(col[16]) || 1) > 20 ? 'SHIPMENT' : 'RETURN'
      };
      results.push(shipment);
    }

    if (results.length === 0) throw new Error('未能提取到有效数据');

    parsedShipments = results;
    selectedIndex = 0;
    setStatus(`解析成功 (${results.length} 条)`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
    throw error;
  } finally {
    setBusy(false);
  }
}

async function sendFillMessage(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.warn('初次发送失败，尝试注入脚本...', error);
    // 注入脚本
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    // 等待 150ms 让脚本初始化完毕
    await new Promise(resolve => setTimeout(resolve, 150));
    // 再次尝试
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function fillSelectedShipment() {
  if (parsedShipments.length === 0) return;

  const shipment = parsedShipments[selectedIndex];
  // 修正后的逻辑：< 20kg 走退货页，> 20kg 走普通发货页
  const isReturn = shipment.weightKg <= 20 || shipment.serviceType === 'RETURN';
  const PAGES = {
    SHIPMENT: 'https://business.dpd.de/auftragsstart/auftrag-starten.aspx',
    RETURN: 'https://business.dpd.de/retouren/retoure-beauftragen.aspx'
  };
  const targetUrl = isReturn ? PAGES.RETURN : PAGES.SHIPMENT;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('未找到活动标签页');

  // 判断是否已经在正确的 DPD 页面
  const isCorrectPage = tab.url && tab.url.toLowerCase().includes(targetUrl.toLowerCase().split('?')[0]);

  if (isCorrectPage) {
    setStatus('正在填入当前页面...', 'loading');
    try {
      await sendFillMessage(tab.id, {
        action: 'FILL_DPD_FORM',
        shipment: shipment
      });
      setStatus('已成功填入当前页', 'success');
    } catch (e) {
      console.error(e);
      setStatus('填单失败，请刷新网页后重试', 'error');
    }
  } else {
    // ... 跳转逻辑保持不变
    // 如果在错误的页面，或者不在 DPD 页面，则执行跳转
    const msg = isReturn ? '检测到大包裹/退货，正在跳转至专用页面...' : '正在跳转至 DPD 发货页面...';
    setStatus(msg, 'loading');
    
    await chrome.storage.local.set({ 
      pendingShipment: shipment,
      pendingTarget: targetUrl
    });
    
    await chrome.tabs.update(tab.id, { url: targetUrl });
    // 提醒用户
    setTimeout(() => setStatus('页面跳转中，完成后将自动填单', 'success'), 500);
  }
}

fillBtn.addEventListener('click', async () => {
  try {
    await parseAddressText();
    await fillSelectedShipment();
  } catch (error) {
    console.error('Operation failed:', error);
    setStatus(error.message, 'error');
  }
});

// 检查更新逻辑
async function checkUpdates() {
  try {
    const response = await fetch('https://folgercn.github.io/dpd-api/version.json', { cache: 'no-cache' });
    const data = await response.json();
    const manifest = chrome.runtime.getManifest();
    
    // 比较版本号：只有线上版本 > 本地版本时才提示
    const isNewer = (remote, local) => {
      const r = remote.split('.').map(Number);
      const l = local.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if (r[i] > l[i]) return true;
        if (r[i] < l[i]) return false;
      }
      return false;
    };

    if (data.version && isNewer(data.version, manifest.version)) {
      const banner = document.createElement('div');
      banner.id = 'updateBanner';
      banner.className = 'update-banner';
      banner.innerHTML = `
        <span>🚀 发现新版本 v${data.version}</span>
        <a href="${data.downloadUrl}" target="_blank">立即下载</a>
        <button id="closeUpdate">✕</button>
      `;
      document.body.prepend(banner);
      document.getElementById('closeUpdate').onclick = () => banner.remove();
    }
  } catch (e) {
    console.error('Check update failed', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const manifest = chrome.runtime.getManifest();
  versionTag.textContent = `v${manifest.version}`;
  checkUpdates();
});
