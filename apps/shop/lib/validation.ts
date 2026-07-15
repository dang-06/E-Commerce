import { normalizeVietnamesePhone } from "./phone";
import type { RecipientForm } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof RecipientForm, string>>;
}

export function validateRecipientForm(form: RecipientForm): ValidationResult {
  const errors: Partial<Record<keyof RecipientForm, string>> = {};

  if (form.recipientName.trim().length < 2) {
    errors.recipientName = "Vui lòng nhập họ tên người nhận.";
  }

  try {
    normalizeVietnamesePhone(form.recipientPhone);
  } catch {
    errors.recipientPhone = "Số điện thoại người nhận chưa đúng định dạng.";
  }

  for (const field of ["province", "district", "ward", "address"] as const) {
    if (form[field].trim().length < 2) {
      errors[field] = "Vui lòng nhập thông tin này.";
    }
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}
