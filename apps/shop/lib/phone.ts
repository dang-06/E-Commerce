export class InvalidPhoneError extends Error {
  constructor() {
    super("Số điện thoại chưa đúng định dạng.");
  }
}

export function normalizeVietnamesePhone(input: string): string {
  const compact = input.trim().replace(/[\s.-]/g, "");
  const normalized = compact.startsWith("+84")
    ? `0${compact.slice(3)}`
    : compact.startsWith("84")
      ? `0${compact.slice(2)}`
      : compact;

  if (!/^0\d{9}$/.test(normalized)) {
    throw new InvalidPhoneError();
  }

  return normalized;
}
