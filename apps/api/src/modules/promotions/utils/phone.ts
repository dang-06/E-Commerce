export class InvalidVietnamesePhoneError extends Error {
  constructor(phone: string) {
    super(`Invalid Vietnamese phone number: ${phone}`);
  }
}

export function normalizeVietnamesePhone(input: string): string {
  const compact = input.trim().replace(/[\s.-]/g, "");
  const withoutCountryCode = compact.startsWith("+84")
    ? `0${compact.slice(3)}`
    : compact.startsWith("84")
      ? `0${compact.slice(2)}`
      : compact;

  if (!/^0\d{9}$/.test(withoutCountryCode)) {
    throw new InvalidVietnamesePhoneError(input);
  }

  return withoutCountryCode;
}

export function maskVietnamesePhone(phone: string): string {
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

