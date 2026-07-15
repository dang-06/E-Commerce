import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number as Vietnamese Dong currency
 * Example: 377000 -> "377.000đ"
 */
export function formatVND(amount: number): string {
  const formatted = Math.floor(amount).toLocaleString('vi-VN')
  return `${formatted}đ`
}

/**
 * Validate Vietnamese phone number
 * Accepts: 10-digit numbers (e.g., 0901234567), +84 format, or with dashes
 */
export function isValidVietnamesePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  
  // Valid if: 10 digits (starts with 0), or 11 digits (starts with 84)
  if (cleaned.length === 10 && cleaned.startsWith('0')) return true
  if (cleaned.length === 11 && cleaned.startsWith('84')) return true
  
  return false
}

/**
 * Format Vietnamese phone number for display
 * Example: "0901234567" -> "0901234567"
 * Can mask last 4 digits for privacy: "090****567"
 */
export function formatPhoneNumber(phone: string, maskPrivacy = false): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (maskPrivacy && cleaned.length >= 8) {
    const start = cleaned.slice(0, 3)
    const end = cleaned.slice(-3)
    return `${start}****${end}`
  }
  
  return cleaned
}

/**
 * Calculate discount for Vietnamese promotion
 * Returns total discount: quantity × 25,000 VND
 */
export function calculatePromotionDiscount(quantity: number, discountPerUnit = 25000): number {
  return quantity * discountPerUnit
}

/**
 * Generate mock order code
 * Format: "DH" + YYYYMMDD + sequence
 * Example: "DH202607150001"
 */
export function generateOrderCode(sequence = 1): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(sequence).padStart(4, '0')
  return `DH${date}${seq}`
}
