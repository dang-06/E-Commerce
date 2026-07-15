const sensitiveKeys = /authorization|api[-_]?key|secret|token|password|credential|cookie/i;
const phonePattern = /\b0\d{9}\b/g;
const bearerPattern = /bearer\s+[a-z0-9._~+/=-]+/gi;

export function redactSensitive(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(phonePattern, "[phone]").replace(bearerPattern, "Bearer [redacted]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sensitiveKeys.test(key) ? "[redacted]" : redactSensitive(item),
      ]),
    );
  }
  return value;
}

export function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return String(redactSensitive(error.message)).slice(0, 1000);
  }
  return String(redactSensitive(error)).slice(0, 1000);
}

export function maskPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 7) {
    return "***";
  }
  return `${normalized.slice(0, 3)}****${normalized.slice(-3)}`;
}
