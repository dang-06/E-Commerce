import { isValidVietnamesePhone } from '@/lib/utils'
import { PROMOTION_CONFIG } from '@/lib/constants'

/**
 * Mock Promotion Service
 * Replace with real API call when backend is ready
 */

export async function checkPromotion(phone: string): Promise<{
  isEligible: boolean
  error?: string
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Validate phone format
  if (!isValidVietnamesePhone(phone)) {
    return {
      isEligible: false,
      error: 'invalid_format',
    }
  }

  // MOCK: Check eligibility based on last digit
  // In production, replace with actual backend API call:
  // const response = await fetch('/api/promotions/check', {
  //   method: 'POST',
  //   body: JSON.stringify({ phone }),
  // })
  // const data = await response.json()
  // return { isEligible: data.eligible }

  const isEligible = PROMOTION_CONFIG.isEligible(phone)

  return {
    isEligible,
  }
}
