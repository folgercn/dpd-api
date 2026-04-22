const DEBUG_LOG_KEY = '__DPD_EXT_DEBUG_LOGS__';
const DEBUG_LOG_LIMIT = 120;

function appendDebugLog(level, message, payload) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    payload: sanitizeDebugPayload(payload),
    pathname: location.pathname,
  };

  try {
    const existing = JSON.parse(sessionStorage.getItem(DEBUG_LOG_KEY) || '[]');
    const next = Array.isArray(existing) ? existing : [];
    next.push(entry);
    sessionStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(next.slice(-DEBUG_LOG_LIMIT)));
    window.__DPD_EXT_DEBUG_LOGS__ = next.slice(-DEBUG_LOG_LIMIT);
  } catch {
    // ignore storage errors
  }
}

function sanitizeDebugPayload(payload) {
  try {
    return JSON.parse(JSON.stringify(payload ?? null));
  } catch {
    return { note: 'unserializable payload' };
  }
}

function debugLog(message, payload) {
  // console.log(`[DPD EXT] ${message}`, payload);
  appendDebugLog('log', message, payload);
}

function debugWarn(message, payload) {
  // console.warn(`[DPD EXT] ${message}`, payload);
  appendDebugLog('warn', message, payload);
}

function debugError(message, payload) {
  // console.error(`[DPD EXT] ${message}`, payload);
  appendDebugLog('error', message, payload);
}

function restorePreviousDebugLogs() {
  try {
    const previousLogs = JSON.parse(sessionStorage.getItem(DEBUG_LOG_KEY) || '[]');
    if (!Array.isArray(previousLogs) || previousLogs.length === 0) {
      return;
    }

    window.__DPD_EXT_DEBUG_LOGS__ = previousLogs;
    // console.log('[DPD EXT] restored previous debug logs', {
    //   count: previousLogs.length,
    //   last: previousLogs.at(-1) || null,
    // });
  } catch {
    // ignore storage errors
  }
}

function installSubmitDebugHooks() {
  if (window.__DPD_EXT_SUBMIT_HOOKS_INSTALLED__) {
    return;
  }
  window.__DPD_EXT_SUBMIT_HOOKS_INSTALLED__ = true;

  const originalSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function patchedSubmit(...args) {
    appendDebugLog('warn', 'form.submit called', {
      formAction: this.action || '',
      formMethod: this.method || '',
      lastActiveElement: document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName || '',
    });
    return originalSubmit.apply(this, args);
  };

  if (typeof window.__doPostBack === 'function') {
    const originalPostBack = window.__doPostBack.bind(window);
    window.__doPostBack = function patchedDoPostBack(...args) {
      appendDebugLog('warn', '__doPostBack called', {
        args,
        lastActiveElement: document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName || '',
      });
      return originalPostBack(...args);
    };
  }

  document.addEventListener(
    'submit',
    (event) => {
      appendDebugLog('warn', 'submit event fired', {
        targetId: event.target?.id || '',
        targetName: event.target?.name || '',
        lastActiveElement: document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName || '',
      });
    },
    true
  );
}

window.addEventListener('beforeunload', () => {
  appendDebugLog('log', 'beforeunload', { href: location.href });
});

restorePreviousDebugLogs();
installSubmitDebugHooks();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'FILL_DPD_FORM' && request.action !== 'FILL_DPD_FORM_V2') {
    return false;
  }

  try {
    appendDebugLog('log', 'new fill request started', { href: location.href });
    debugLog('received fill request', {
      action: request.action,
      pathname: location.pathname,
      rawShipment: request.shipment,
    });
    const shipment = prepareShipment(request.shipment || {});
    debugLog('normalized shipment', shipment);
    const result = location.pathname.includes('/retouren/')
      ? fillReturnPage(shipment)
      : fillStartOrderPage(shipment);

    debugLog('fill result', result);
    sendResponse({ success: true, ...result });
  } catch (error) {
    debugError('fill error', { message: error.message, stack: error.stack });
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

function fillStartOrderPage(shipment) {
  const missed = [];
  let filledCount = 0;
  const warehouse = shipment.warehouse || null;
  debugLog('fillStartOrderPage', { shipment, warehouse });
  logVisibleFormControls('shipment-page-before-fill');
  logAddressBlockSnapshot('LabelAddress', 'customer-before-fill');
  logAddressBlockSnapshot('ShipAddress', 'warehouse-before-fill');

  ensureShipmentSenderMode();
  clearShipmentPageFields();
  filledCount += fillAddressBlock('LabelAddress', shipment, missed, 'customer');
  if (warehouse) {
    filledCount += fillAddressBlock('ShipAddress', warehouse, missed, 'warehouse');
  }
  filledCount += fillField('CPLContentLarge_txtOrderData_ParcelCounter', shipment.quantity, missed, 'quantity');
  filledCount += fillField('txtWeight_Parcel_1', shipment.weightKg, missed, 'weightKg');
  filledCount += fillField('txtOrderData_OrderReferenceList_OrderReference1', shipment.reference, missed, 'reference');

  if (shipment.lengthCm) filledCount += fillField('txtLength_Parcel_1', shipment.lengthCm, missed, 'lengthCm');
  if (shipment.widthCm) filledCount += fillField('txtWidth_Parcel_1', shipment.widthCm, missed, 'widthCm');
  if (shipment.heightCm) filledCount += fillField('txtHeight_Parcel_1', shipment.heightCm, missed, 'heightCm');

  return { filledCount, missed };
}

function ensureShipmentSenderMode() {
  const element =
    document.getElementById('CPLContentLarge_chkLabelAddress_UsePickupAddressAsLabelAddress') ||
    document.getElementById('chkLabelAddress_UsePickupAddressAsLabelAddress');

  if (!element) {
    debugWarn('sender mode checkbox not found');
    return;
  }

  debugLog('sender mode checkbox state', {
    id: element.id || '',
    checked: Boolean(element.checked),
  });

  if (element.checked) {
    debugWarn('sender mode still uses pickup address; skipping checkbox toggle to avoid page refresh');
  }
}

function fillAddressBlock(prefix, address, missed, labelPrefix) {
  let filledCount = 0;
  const countryId = prefix === 'ShipAddress' ? 'CPLContentLarge_selShipAddress_Country' : `sel${prefix}_Country`;
  debugLog('fillAddressBlock', { prefix, labelPrefix, address, countryId });

  filledCount += fillField(`txt${prefix}_Company`, address.company, missed, `${labelPrefix}.company`);
  filledCount += fillField(`txt${prefix}_FirstName`, address.firstName, missed, `${labelPrefix}.firstName`);
  filledCount += fillField(`txt${prefix}_LastName`, address.lastName, missed, `${labelPrefix}.lastName`);
  filledCount += fillSelect(countryId, address.country, missed, `${labelPrefix}.country`);
  filledCount += fillField(`txt${prefix}_ZipCode`, address.postalCode, missed, `${labelPrefix}.postalCode`);
  filledCount += fillField(`txt${prefix}_City`, address.city, missed, `${labelPrefix}.city`);
  filledCount += fillField(`txt${prefix}_Street`, address.street, missed, `${labelPrefix}.street`);
  filledCount += fillField(`txt${prefix}_HouseNo`, address.houseNumber, missed, `${labelPrefix}.houseNumber`);
  filledCount += fillField(`txt${prefix}_Mail`, address.email, missed, `${labelPrefix}.email`);
  filledCount += fillField(`txt${prefix}_Phone`, address.phone, missed, `${labelPrefix}.phone`);

  return filledCount;
}

function fillReturnPage(shipment) {
  const missed = [];
  let filledCount = 0;
  debugLog('fillReturnPage', { shipment });
  logVisibleFormControls('return-page-before-fill');

  filledCount += fillField('CPLContentLarge_chkInput_WithAddress', true, missed, 'returnAddressMode');
  clearReturnPageFields();
  filledCount += fillReturnAddressByIds(shipment, missed, 'customer');
  filledCount += fillField('CPLContentLarge_txtParcelCount', shipment.quantity, missed, 'quantity');
  filledCount += fillField('txtWeight_Parcel1', shipment.weightKg, missed, 'weightKg');
  filledCount += fillField('txtOrderReference1', shipment.reference, missed, 'reference1');

  return { filledCount, missed };
}

function fillReturnAddressByIds(address, missed, labelPrefix) {
  let filledCount = 0;
  debugLog('fillReturnAddressByIds', { address, labelPrefix });

  const fields = [
    { id: 'txtCompany', label: `${labelPrefix}.company`, value: address.company },
    { id: 'txtFirstName', label: `${labelPrefix}.firstName`, value: address.firstName },
    { id: 'txtLastName', label: `${labelPrefix}.lastName`, value: address.lastName },
    { id: 'txtZipCode_WithAddress', label: `${labelPrefix}.postalCode`, value: address.postalCode },
    { id: 'txtCity', label: `${labelPrefix}.city`, value: address.city },
    { id: 'txtStreet', label: `${labelPrefix}.street`, value: address.street },
    { id: 'txtHouseNo', label: `${labelPrefix}.houseNumber`, value: address.houseNumber },
    { id: 'txtMail_WithAddress', label: `${labelPrefix}.email`, value: address.email },
    { id: 'txtPhone', label: `${labelPrefix}.phone`, value: address.phone },
  ];

  for (const field of fields) {
    if (!field.value) {
      debugLog('skip empty return field', field.label);
      continue;
    }

    filledCount += fillField(field.id, field.value, missed, field.label);
  }

  if (address.country) {
    filledCount += fillSelect('CPLContentLarge_selCountry_WithAddress', address.country, missed, `${labelPrefix}.country`);
  }

  return filledCount;
}

function clearShipmentPageFields() {
  debugLog('clearShipmentPageFields');
  clearAddressBlock('LabelAddress');
  clearAddressBlock('ShipAddress');
  clearFieldValue('CPLContentLarge_txtOrderData_ParcelCounter');
  clearFieldValue('txtWeight_Parcel_1');
  clearFieldValue('txtOrderData_OrderReferenceList_OrderReference1');
  clearFieldValue('txtLength_Parcel_1');
  clearFieldValue('txtWidth_Parcel_1');
  clearFieldValue('txtHeight_Parcel_1');
}

function clearReturnPageFields() {
  debugLog('clearReturnPageFields');
  [
    'txtCompany',
    'txtFirstName',
    'txtLastName',
    'txtAdditionalInfo',
    'txtZipCode_WithAddress',
    'txtCity',
    'txtStreet',
    'txtHouseNo',
    'txtMail_WithAddress',
    'txtPhone',
    'CPLContentLarge_txtParcelCount',
    'txtWeight_Parcel1',
    'txtOrderReference1',
    'txtOrderReference2',
    'txtOrderReference3',
    'txtOrderReference4',
  ].forEach(clearFieldValue);
  clearSelectValue('CPLContentLarge_selCountry_WithAddress');
}

function clearAddressBlock(prefix) {
  [
    `txt${prefix}_Company`,
    `txt${prefix}_FirstName`,
    `txt${prefix}_LastName`,
    `txt${prefix}_ZipCode`,
    `txt${prefix}_City`,
    `txt${prefix}_Street`,
    `txt${prefix}_HouseNo`,
    `txt${prefix}_Mail`,
    `txt${prefix}_Phone`,
  ].forEach(clearFieldValue);
}

function isVisibleElement(element) {
  if (!element) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function logVisibleFormControls(scope) {
  const controls = Array.from(document.querySelectorAll('input, textarea, select'))
    .filter((element) => isVisibleElement(element) && !element.disabled && element.type !== 'hidden')
    .map((element, index) => {
      const containerText = (element.closest('div, td, th, tr, section, li')?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);

      return {
        index,
        tag: element.tagName,
        type: element.type || '',
        id: element.id || '',
        name: element.name || '',
        placeholder: element.getAttribute('placeholder') || '',
        ariaLabel: element.getAttribute('aria-label') || '',
        title: element.getAttribute('title') || '',
        value: element.value || '',
        containerText,
      };
  });

  debugLog('visible form controls', { scope, controls });
  // console.log('[DPD EXT] visible form controls JSON\n' + JSON.stringify({ scope, controls }, null, 2));
  window.__DPD_EXT_VISIBLE_CONTROLS__ = { scope, controls };
}

function logAddressBlockSnapshot(prefix, scope) {
  const ids = [
    `txt${prefix}_Company`,
    `txt${prefix}_FirstName`,
    `txt${prefix}_LastName`,
    `txt${prefix}_ZipCode`,
    `txt${prefix}_City`,
    `txt${prefix}_Street`,
    `txt${prefix}_HouseNo`,
    `txt${prefix}_Mail`,
    `txt${prefix}_Phone`,
    prefix === 'ShipAddress' ? 'CPLContentLarge_selShipAddress_Country' : `sel${prefix}_Country`,
  ];

  const fields = ids.map((id) => {
    const element = document.getElementById(id) || document.getElementById(`CPLContentLarge_${id}`);
    if (!element) {
      return { id, found: false };
    }

    return {
      id,
      found: true,
      tag: element.tagName,
      type: element.type || '',
      name: element.name || '',
      value: element.value || '',
      containerText: (element.closest('div, td, th, tr, section, li')?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160),
    };
  });

  debugLog('address block snapshot', { prefix, scope, fields });
}

function fillSelectElement(select, country, missed, label) {
  const wanted = normalizeCountry(country);
  const option = Array.from(select.options).find((item) => {
    const value = normalizeCountry(item.value);
    const text = normalizeCountry(item.textContent || '');
    return value === wanted || text === wanted || text.includes(wanted);
  });

  if (!option) {
    debugWarn('select option not found', {
      label,
      wanted,
      selectId: select.id || '',
      options: Array.from(select.options).map((item) => ({
        value: item.value,
        text: item.textContent || '',
      })),
    });
    missed.push(label);
    return 0;
  }

  select.value = option.value;
  triggerEvents(select);
  debugLog('select filled', {
    label,
    wanted,
    selectedValue: option.value,
    selectId: select.id || '',
  });
  return 1;
}

function prepareShipment(shipment) {
  const streetParts = splitStreetAndHouseNumber(shipment.street || shipment.addressLine1 || '');
  const nameParts = splitName(shipment.recipientName || '');

  return {
    recipientName: shipment.recipientName || '',
    firstName: shipment.firstName || nameParts.firstName,
    lastName: shipment.lastName || nameParts.lastName,
    company: shipment.company || '',
    street: shipment.street || streetParts.street,
    houseNumber: shipment.houseNumber || streetParts.houseNumber,
    postalCode: shipment.postalCode || shipment.recipientZip || '',
    city: shipment.city || shipment.recipientCity || '',
    country: normalizeCountry(shipment.countryCode || shipment.recipientCountry || 'DE'),
    phone: shipment.phone || '',
    email: shipment.email || '',
    quantity: Number(shipment.quantity) || 1,
    weightKg: shipment.weightKg || shipment.weight || '',
    lengthCm: shipment.lengthCm || shipment.length || '',
    widthCm: shipment.widthCm || shipment.width || '',
    heightCm: shipment.heightCm || shipment.height || '',
    reference: shipment.reference || [shipment.orderNo, shipment.sku].filter(Boolean).join(' / ') || shipment.orderReference || '',
    warehouse: shipment.warehouse ? {
      recipientName: shipment.warehouse.recipientName || '',
      firstName: shipment.warehouse.firstName || '',
      lastName: shipment.warehouse.lastName || '',
      company: shipment.warehouse.company || '',
      street: shipment.warehouse.street || '',
      houseNumber: shipment.warehouse.houseNumber || '',
      postalCode: shipment.warehouse.postalCode || '',
      city: shipment.warehouse.city || '',
      country: normalizeCountry(shipment.warehouse.countryCode || shipment.warehouse.country || 'DE'),
      phone: shipment.warehouse.phone || '',
      email: shipment.warehouse.email || '',
    } : null,
  };
}

function fillField(id, value, missed, label) {
  if (value === undefined || value === null || value === '') {
    debugLog('skip empty field', { id, label });
    return 0;
  }

  const prefixMatch = id.match(/^txt([A-Za-z]+)_/) || id.match(/^CPLContentLarge_chk([A-Za-z]+)_/) || id.match(/^sel([A-Za-z]+)_/);
  const prefix = prefixMatch?.[1] || '';
  let element = document.getElementById(id) || document.getElementById(`CPLContentLarge_${id}`);

  if (!element && prefix) {
    const parts = id.split('_');
    const keyword = parts.length > 1 ? parts.slice(1).join('_') : id;
    element = document.querySelector(`[id*="${prefix}"][id*="${keyword}"]`);
  }

  if (!element && (id.includes('ZipCode') || id.includes('PLZ'))) {
    element = document.querySelector(`[id*="${prefix}"][id*="Zip"]`) || document.querySelector(`[id*="${prefix}"][id*="PLZ"]`);
  }

  if (!element) {
    debugWarn('field not found', { id, label, prefix, value });
    missed.push(label);
    return 0;
  }

  debugLog('filling field', {
    id,
    label,
    value,
    matchedId: element.id || '',
    placeholder: element.getAttribute?.('placeholder') || '',
    type: element.type || element.tagName,
  });

  if (element.type === 'checkbox' || element.type === 'radio') {
    element.checked = Boolean(value);
    triggerEvents(element);
    return 1;
  }

  setNativeValue(element, String(value));
  triggerEvents(element);
  return 1;
}

function fillSelect(id, country, missed, label) {
  const select = document.getElementById(id);
  if (!select) {
    debugWarn('select not found', { id, label, country });
    missed.push(label);
    return 0;
  }

  const wanted = normalizeCountry(country);
  const current = normalizeCountry(select.value);
  if (current === wanted) {
    debugLog('select already correct', {
      id,
      label,
      country,
      normalizedCountry: wanted,
      currentValue: select.value,
    });
    return 1;
  }

  const option = Array.from(select.options).find((item) => {
    const value = normalizeCountry(item.value);
    const text = normalizeCountry(item.textContent || '');
    return value === wanted || text === wanted || text.includes(wanted);
  });

  if (!option) {
    debugWarn('select option not found', {
      id,
      label,
      country,
      normalizedCountry: wanted,
      options: Array.from(select.options).map((item) => ({
        value: item.value,
        text: item.textContent || '',
      })),
    });
    missed.push(label);
    return 0;
  }

  select.value = option.value;
  triggerEvents(select);
  debugLog('select filled', {
    id,
    label,
    country,
    normalizedCountry: wanted,
    selectedValue: option.value,
  });
  return 1;
}

function clearFieldValue(id) {
  const element = document.getElementById(id) || document.getElementById(`CPLContentLarge_${id}`);
  if (!element) {
    return;
  }

  if (element.type === 'checkbox' || element.type === 'radio') {
    element.checked = false;
    triggerEvents(element);
    return;
  }

  setNativeValue(element, '');
  triggerEvents(element);
}

function clearSelectValue(id) {
  const select = document.getElementById(id) || document.getElementById(`CPLContentLarge_${id}`);
  if (!select || select.tagName !== 'SELECT') {
    return;
  }

  const emptyOption = Array.from(select.options).find((option) => !String(option.value || '').trim());
  if (emptyOption) {
    select.value = emptyOption.value;
  }
  triggerEvents(select);
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

function splitName(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: '', lastName: parts[0] || '' };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) || '',
  };
}

function splitStreetAndHouseNumber(address) {
  const match = String(address).trim().match(/^(.+?)\s+(\d+\s?[a-zA-Z]?(?:[-/]\d+\s?[a-zA-Z]?)?)$/);
  if (!match) {
    return { street: address, houseNumber: '' };
  }

  return { street: match[1], houseNumber: match[2] };
}

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
