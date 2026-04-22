chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'FILL_DPD_FORM') {
    return false;
  }

  try {
    const shipment = prepareShipment(request.shipment || {});
    const result = location.pathname.includes('/retouren/')
      ? fillReturnPage(shipment)
      : fillStartOrderPage(shipment);

    sendResponse({ success: true, ...result });
  } catch (error) {
    console.error('DPD fill error:', error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

const WAREHOUSE = {
  recipientName: 'Hua Zhang',
  firstName: 'Hua',
  lastName: 'Zhang',
  company: 'EXPO Service GmbH',
  street: 'Darmstädter Str.',
  houseNumber: '117',
  postalCode: '64319',
  city: 'Pfungstadt',
  country: 'DEU',
  phone: '+49 (0)15257038155',
  email: 'zhhh6489@gmail.com',
};

function fillAddressBlock(prefix, address, missed, labelPrefix) {
  let filledCount = 0;

  // 处理称呼 - 尝试多种可能的 ID (DPD 在不同页面用 Mr/Male)
  if (address.company) {
    filledCount += fillField(`CPLContentLarge_chk${prefix}_Salutation_Company`, true, missed, `${labelPrefix}.salutation_company`, prefix);
    filledCount += fillField(`txt${prefix}_Company`, address.company, missed, `${labelPrefix}.company`, prefix);
  } else {
    // 尝试不同的“无称呼” ID
    const noneIds = [`CPLContentLarge_chk${prefix}_Salutation_None`, `CPLContentLarge_chk${prefix}_Salutation_None_None` /* 备选 */];
    let foundNone = false;
    for (const nid of noneIds) {
      if (document.getElementById(nid)) {
        filledCount += fillField(nid, true, missed, `${labelPrefix}.salutation_none`, prefix);
        foundNone = true;
        break;
      }
    }
    // 强制清空公司名
    filledCount += fillField(`txt${prefix}_Company`, '', missed, `${labelPrefix}.company`, prefix);
  }

  // 姓名处理
  const [firstName, lastName] = address.recipientName ? splitName(address.recipientName) : [address.firstName, address.lastName];
  filledCount += fillField(`txt${prefix}_FirstName`, firstName, missed, `${labelPrefix}.firstName`, prefix);
  filledCount += fillField(`txt${prefix}_LastName`, lastName, missed, `${labelPrefix}.lastName`, prefix);

  // 地址处理
  const [street, houseNo] = address.street ? splitStreet(address.street) : [address.streetName, address.houseNumber];
  filledCount += fillField(`txt${prefix}_Street`, street, missed, `${labelPrefix}.street`, prefix);
  filledCount += fillField(`txt${prefix}_HouseNo`, houseNo || address.houseNumber || '', missed, `${labelPrefix}.houseNo`, prefix);
  
  filledCount += fillField(`txt${prefix}_ZipCode`, address.postalCode, missed, `${labelPrefix}.postalCode`, prefix);
  filledCount += fillField(`txt${prefix}_City`, address.city, missed, `${labelPrefix}.city`, prefix);
  filledCount += fillField(`txt${prefix}_Phone`, address.phone, missed, `${labelPrefix}.phone`, prefix);
  filledCount += fillField(`txt${prefix}_Mail`, address.email || '', missed, `${labelPrefix}.email`, prefix);

  // 地址补充信息 (Adresszusatz)
  if (address.addressLine2) {
    filledCount += fillField(`txt${prefix}_AdditionalInfo`, address.addressLine2, missed, `${labelPrefix}.additionalInfo`, prefix);
  }

  // 国家选择器
  if (address.country) {
    const countryIds = [`sel${prefix}_Country`, `CPLContentLarge_sel${prefix}_Country`];
    for (const cid of countryIds) {
      if (document.getElementById(cid)) {
        filledCount += fillSelect(cid, address.country, missed, `${labelPrefix}.country`);
        break;
      }
    }
  }

  return filledCount;
}

function fillStartOrderPage(shipment) {
  const missed = [];
  let filledCount = 0;

  // 1. 填充发件人 (LabelAddress)
  if (shipment.sender) {
    filledCount += fillAddressBlock('LabelAddress', shipment.sender, missed, 'sender');
  }

  // 2. 填充收件人 (ShipAddress)
  if (shipment.recipient) {
    filledCount += fillAddressBlock('ShipAddress', shipment.recipient, missed, 'recipient');
  }

  // 重量和参考号 (使用发货页专属的长 ID)
  filledCount += fillField('txtWeight_Parcel_1', shipment.weightKg, missed, 'weightKg');
  filledCount += fillField('txtOrderData_OrderReferenceList_OrderReference1', shipment.reference, missed, 'reference1');

  return { filledCount, missed };
}

function fillReturnPage(shipment) {
  const missed = [];
  let filledCount = 0;

  // 1. 勾选“现在输入地址”按钮
  filledCount += fillField('CPLContentLarge_chkInput_WithAddress', true, missed, 'inputNow');

  // 2. 填充发件人 (Absender) - 也就是表格里的“发件人”
  if (shipment.sender) {
    filledCount += fillAddressBlock('Absender', shipment.sender, missed, 'sender');
  }

  // 3. 填充重量和参考号
  filledCount += fillField('txtWeight_Parcel1', shipment.weightKg, missed, 'weightKg');
  filledCount += fillField('txtOrderReference1', shipment.reference, missed, 'reference1');

  return { filledCount, missed };
}

function prepareShipment(shipment) {
  return {
    sender: shipment.sender ? prepareAddress(shipment.sender) : null,
    recipient: shipment.recipient ? prepareAddress(shipment.recipient) : null,
    weightKg: shipment.weightKg || shipment.weight || '',
    reference: shipment.reference || [shipment.orderNo, shipment.sku].filter(Boolean).join(' / ') || shipment.orderReference || shipment.sourceRow || '',
  };
}

function prepareAddress(addr) {
  const [firstName, lastName] = splitName(addr.recipientName || '');
  const [street, houseNo] = splitStreet(addr.street || '');

  return {
    recipientName: addr.recipientName || '',
    firstName: addr.firstName || firstName,
    lastName: addr.lastName || lastName,
    company: addr.company || '',
    street: street,
    houseNumber: addr.houseNumber || houseNo,
    postalCode: addr.postalCode || '',
    city: addr.city || '',
    country: normalizeCountry(addr.countryCode || addr.country || 'DE'),
    phone: addr.phone || '',
    email: addr.email || '',
    addressLine2: addr.addressLine2 || '',
  };
}

function fillField(id, value, missed, label, prefix = '') {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  // 1. 尝试绝对精准匹配
  let el = document.getElementById(id) || document.getElementById(`CPLContentLarge_${id}`);
  
  // 2. 如果精准匹配失败，尝试带前缀的模糊匹配
  if (!el && prefix) {
    // 提取有意义的关键词（避开单纯的数字）
    const parts = id.split('_');
    const keyword = parts.length > 1 ? parts.slice(1).join('_') : id;
    el = document.querySelector(`[id*="${prefix}"][id*="${keyword}"]`);
  }
  
  // 3. 针对邮编的特殊模糊匹配
  if (!el && (id.includes('ZipCode') || id.includes('PLZ'))) {
    el = document.querySelector(`[id*="${prefix}"][id*="Zip"]`) || document.querySelector(`[id*="${prefix}"][id*="PLZ"]`);
  }

  if (el) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = Boolean(value);
      if (el.checked) el.click();
    } else {
      // 强力填入逻辑
      setNativeValue(el, String(value));
    }
    triggerEvents(el);
    return 1;
  }
  
  if (missed) missed.push(label);
  return 0;
}

function fillSelect(id, country, missed, label) {
  const select = document.getElementById(id);
  if (!select) {
    missed.push(label);
    return 0;
  }

  const wanted = normalizeCountry(country);
  const option = Array.from(select.options).find((item) => {
    const value = normalizeCountry(item.value);
    const text = normalizeCountry(item.textContent || '');
    return value === wanted || text === wanted || text.includes(wanted);
  });

  if (!option) {
    missed.push(label);
    return 0;
  }

  select.value = option.value;
  triggerEvents(select);
  return 1;
}

function setNativeValue(element, value) {
  const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;
  if (setter) {
    setter.call(element, value);
  } else {
    element.value = value;
  }
}

function triggerEvents(element) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

// splitName 和 splitStreet 统一定义在文件末尾

function normalizeCountry(country) {
  const raw = String(country || '').trim().toUpperCase();
  const map = {
    DE: 'DEU',
    DEU: 'DEU',
    GERMANY: 'DEU',
    DEUTSCHLAND: 'DEU',
    IT: 'ITA',
    ITA: 'ITA',
    ITALY: 'ITA',
    ITALIEN: 'ITA',
    FR: 'FRA',
    FRA: 'FRA',
    FRANCE: 'FRA',
    FRANKREICH: 'FRA',
    AT: 'AUT',
    AUT: 'AUT',
    AUSTRIA: 'AUT',
    OESTERREICH: 'AUT',
    ÖSTERREICH: 'AUT',
    NL: 'NLD',
    NLD: 'NLD',
    NETHERLANDS: 'NLD',
    NIEDERLANDE: 'NLD',
    ES: 'ESP',
    ESP: 'ESP',
    SPAIN: 'ESP',
    SPANIEN: 'ESP',
    PL: 'POL',
    POL: 'POL',
    POLAND: 'POL',
    POLEN: 'POL',
  };

  return map[raw] || raw;
}

// 自动填单逻辑：检查是否有待处理的运单
async function checkPendingShipment() {
  try {
    const data = await chrome.storage.local.get(['pendingShipment', 'pendingTarget']);
    if (data.pendingShipment) {
      // 检查当前 URL 是否匹配目标 URL（模糊匹配）
      const currentUrl = window.location.href;
      if (data.pendingTarget && currentUrl.includes(data.pendingTarget.split('?')[0])) {
        console.log('Detecting pending shipment, auto-filling...', data.pendingShipment);
        
        // 立即清除，防止页面刷新导致重复执行
        await chrome.storage.local.remove(['pendingShipment', 'pendingTarget']);
        
        // 等待页面完全加载就绪（针对某些动态渲染的 DPD 页面）
        setTimeout(() => {
          const shipment = prepareShipment(data.pendingShipment);
          const result = location.pathname.includes('/retouren/')
            ? fillReturnPage(shipment)
            : fillStartOrderPage(shipment);
          
          console.log('Auto-fill completed:', result);
        }, 1500);
      }
    }
  } catch (err) {
    console.error('DPD Auto-fill check failed:', err);
  }
}

// 在页面加载完成后执行检查
if (document.readyState === 'complete') {
  checkPendingShipment();
} else {
  window.addEventListener('load', checkPendingShipment);
}
function splitName(fullName) {
  if (!fullName) return ['', ''];
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return ['', fullName];
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return [firstName, lastName];
}

function splitStreet(fullStreet) {
  if (!fullStreet) return ['', ''];
  const parts = fullStreet.trim().split(/\s+(?=\d)/);
  if (parts.length <= 1) return [fullStreet, ''];
  return [parts[0], parts[1]];
}
