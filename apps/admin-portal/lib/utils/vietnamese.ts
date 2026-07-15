import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * Format number as Vietnamese Dong (VND)
 * @param amount - Amount in VND
 * @returns Formatted string like "1.234.567 ₫"
 */
export function formatVND(amount: number): string {
  const formatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  // Replace the currency symbol or adjust as needed
  return formatted.replace('₫', '₫').trim()
}

/**
 * Format date as Vietnamese format DD/MM/YYYY
 * @param date - Date to format
 * @returns Formatted string like "15/07/2024"
 */
export function formatVietnameseDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy', { locale: vi })
}

/**
 * Format date and time as Vietnamese format DD/MM/YYYY HH:mm
 * @param date - Date to format
 * @returns Formatted string like "15/07/2024 14:30"
 */
export function formatVietnameseDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: vi })
}

/**
 * Format date and time with full day name
 * @param date - Date to format
 * @returns Formatted string like "Thứ Hai, 15/07/2024 14:30"
 */
export function formatVietnameseDateTimeWithDay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, "EEEE, dd/MM/yyyy HH:mm", { locale: vi })
}

/**
 * Mask Vietnamese phone number to show only last 4 digits
 * @param phone - Phone number like "0901234567"
 * @returns Masked phone like "****4567"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return phone
  const last4 = phone.slice(-4)
  return `****${last4}`
}

/**
 * Validate Vietnamese phone number format
 * @param phone - Phone number to validate
 * @returns True if valid Vietnamese phone
 */
export function validateVietnamesePhone(phone: string): boolean {
  // Vietnamese phone number pattern: 10 digits starting with 0
  const pattern = /^0\d{9}$/
  return pattern.test(phone.replace(/\s|-/g, ''))
}

/**
 * Format phone number for display
 * @param phone - Phone number like "0901234567"
 * @returns Formatted like "0901-234-567"
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

/**
 * Get relative time string in Vietnamese
 * @param date - Date to compare
 * @returns String like "2 giờ trước"
 */
export function getRelativeTimeVietnamese(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`

  return format(dateObj, 'dd/MM/yyyy', { locale: vi })
}

/**
 * Get day name in Vietnamese
 * @param date - Date
 * @returns Day name like "Thứ Hai"
 */
export function getDayNameVietnamese(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'EEEE', { locale: vi })
}

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(num))
}

/**
 * Parse percentage format
 * @param percent - Percentage as decimal (e.g., 0.25 for 25%)
 * @returns Formatted string like "25%"
 */
export function formatPercent(percent: number): string {
  return `${Math.round(percent * 100)}%`
}
