type MemoryWindow = {
  count: number;
  windowStart: number;
};

const licenseRateLimitMap = new Map<string, MemoryWindow>();

export function getAllowedLicenseKeys() {
  const raw = [
    process.env.EXTENSION_LICENSE_KEYS || "",
    process.env.EXTENSION_LICENSE_KEY || "",
  ]
    .join(",")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(raw));
}

export function isLicenseKeyValid(licenseKey: string) {
  const allowedKeys = getAllowedLicenseKeys();
  if (allowedKeys.length === 0) {
    return false;
  }

  return allowedKeys.includes(String(licenseKey).trim());
}

export function maskLicenseKey(licenseKey: string) {
  const value = String(licenseKey || "");
  if (value.length <= 8) {
    return "***";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function checkAndConsumeLicenseRateLimit(licenseKey: string) {
  const now = Date.now();
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
  const licenseLimit = Number(process.env.LICENSE_RATE_LIMIT) || 10;
  const current = licenseRateLimitMap.get(licenseKey) || {
    count: 0,
    windowStart: now,
  };

  if (now - current.windowStart > windowMs) {
    current.count = 1;
    current.windowStart = now;
  } else {
    current.count += 1;
  }

  licenseRateLimitMap.set(licenseKey, current);

  return {
    allowed: current.count <= licenseLimit,
    count: current.count,
    limit: licenseLimit,
    windowStart: current.windowStart,
  };
}
