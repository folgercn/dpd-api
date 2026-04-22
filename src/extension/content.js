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

function fillStartOrderPage(shipment) {
  const missed = [];
  let filledCount = 0;

  // 20kg-under flow: the upper Absender/LabelAddress block is the customer.
  // The lower Empfänger/ShipAddress block is the fixed warehouse.
  filledCount += fillField('CPLContentLarge_chkLabelAddress_UsePickupAddressAsLabelAddress', false, missed, 'usePickupAsSender');
  filledCount += fillAddressBlock('LabelAddress', shipment, missed, 'customer');
  filledCount += fillAddressBlock('ShipAddress', WAREHOUSE, missed, 'warehouse');
  filledCount += fillField('txtWeight_Parcel_1', shipment.weightKg, missed, 'weightKg');
  filledCount += fillField('txtOrderData_OrderReferenceList_OrderReference1', shipment.reference, missed, 'reference');

  if (shipment.lengthCm) filledCount += fillField('txtLength_Parcel_1', shipment.lengthCm, missed, 'lengthCm');
  if (shipment.widthCm) filledCount += fillField('txtWidth_Parcel_1', shipment.widthCm, missed, 'widthCm');
  if (shipment.heightCm) filledCount += fillField('txtHeight_Parcel_1', shipment.heightCm, missed, 'heightCm');

  return { filledCount, missed };
}

function fillAddressBlock(prefix, address, missed, labelPrefix) {
  let filledCount = 0;
  const countryId = prefix === 'ShipAddress' ? 'CPLContentLarge_selShipAddress_Country' : `sel${prefix}_Country`;

  filledCount += fillField(`CPLContentLarge_chk${prefix}_Salutation_None`, true, missed, `${labelPrefix}.salutation`);
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

  // Real myDPD return page. For 20kg+ retoure this page only exposes country,
  // postcode, email, references and package weight for the sender/customer.
  filledCount += fillField('CPLContentLarge_chkInput_WithAddress', true, missed, 'returnAddressMode');
  filledCount += fillSelect('CPLContentLarge_selCountry_WithoutAddress', shipment.country, missed, 'country');
  filledCount += fillField('txtZipCode_WithoutAddress', shipment.postalCode, missed, 'postalCode');
  filledCount += fillField('txtMail_WithoutAddress', shipment.email, missed, 'email');
  filledCount += fillField('txtWeight_Parcel1', shipment.weightKg, missed, 'weightKg');
  filledCount += fillField('txtOrderReference1', shipment.reference || shipment.recipientName, missed, 'reference1');

  return { filledCount, missed };
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
    weightKg: shipment.weightKg || shipment.weight || '',
    lengthCm: shipment.lengthCm || shipment.length || '',
    widthCm: shipment.widthCm || shipment.width || '',
    heightCm: shipment.heightCm || shipment.height || '',
    reference: shipment.reference || [shipment.orderNo, shipment.sku].filter(Boolean).join(' / ') || shipment.orderReference || shipment.sourceRow || '',
  };
}

function fillField(id, value, missed, label) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const element = document.getElementById(id);
  if (!element) {
    missed.push(label);
    return 0;
  }

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
