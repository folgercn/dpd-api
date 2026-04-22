type WarehouseAddress = {
  recipientName: string;
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  countryCode: string;
  phone: string;
  email: string;
};

function splitName(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return {
      firstName: "",
      lastName: parts[0] || "",
    };
  }

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function splitStreetAndHouseNumber(address: string) {
  const match = String(address || "").trim().match(/^(.+?)\s+(\d+\s?[a-zA-Z]?(?:[-/]\d+\s?[a-zA-Z]?)?)$/);
  if (!match) {
    return {
      street: String(address || "").trim(),
      houseNumber: "",
    };
  }

  return {
    street: match[1],
    houseNumber: match[2],
  };
}

function normalizeCountryCode(country: string) {
  const raw = String(country || "").trim().toUpperCase();
  const map: Record<string, string> = {
    DE: "DE",
    DEU: "DE",
    GERMANY: "DE",
    DEUTSCHLAND: "DE",
    IT: "IT",
    ITA: "IT",
    ITALY: "IT",
    ITALIEN: "IT",
    FR: "FR",
    FRA: "FR",
    FRANCE: "FR",
    FRANKREICH: "FR",
    AT: "AT",
    AUT: "AT",
    AUSTRIA: "AT",
    OESTERREICH: "AT",
    ÖSTERREICH: "AT",
    NL: "NL",
    NLD: "NL",
    NETHERLANDS: "NL",
    NIEDERLANDE: "NL",
    ES: "ES",
    ESP: "ES",
    SPAIN: "ES",
    SPANIEN: "ES",
    PL: "PL",
    POL: "PL",
    POLAND: "PL",
    POLEN: "PL",
  };

  return map[raw] || raw || "DE";
}

export function getWarehouseInfo(): WarehouseAddress | null {
  const raw = String(process.env.WAREHOUSE_INFO || "").trim();
  if (!raw) {
    return null;
  }

  const parts = raw.split(",").map((item) => item.trim()).filter(Boolean);
  if (parts.length < 6) {
    return null;
  }

  const company = parts[0] || "";
  const recipientName = parts[1] || "";
  const streetRaw = parts[2] || "";

  let postalCode = "";
  let city = "";
  let countryCode = "DE";
  let email = "";
  let phone = "";

  if (parts.length >= 8) {
    postalCode = parts[3] || "";
    city = parts[4] || "";
    countryCode = normalizeCountryCode(parts[5] || "DE");
    email = parts[6] || "";
    phone = parts[7] || "";
  } else {
    const postalCityRaw = parts[3] || "";
    const postalCityMatch = postalCityRaw.match(/^(\d{4,6})\s+(.+)$/);
    postalCode = postalCityMatch?.[1] || postalCityRaw;
    city = postalCityMatch?.[2] || "";
    countryCode = normalizeCountryCode(parts[4] || "DE");
    email = parts[5] || "";
    phone = parts[6] || "";
  }

  const name = splitName(recipientName);
  const street = splitStreetAndHouseNumber(streetRaw);

  return {
    recipientName,
    firstName: name.firstName,
    lastName: name.lastName,
    company,
    street: street.street,
    houseNumber: street.houseNumber,
    postalCode,
    city,
    countryCode,
    phone,
    email,
  };
}
