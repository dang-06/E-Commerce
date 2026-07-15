'use client'

import { useCallback } from 'react'
import type { PromotionStatus } from '@/lib/types'
import { useLocalStorage } from './useLocalStorage'

/**
 * Hook for managing promotion status and eligibility
 */
export function usePromotion() {
  const [promotionStatus, setPromotionStatus] = useLocalStorage<PromotionStatus | null>(
    'promotionStatus',
    null
  )

  const setPromotion = useCallback(
    (phone: string, isEligible: boolean) => {
      setPromotionStatus({
        phone,
        isEligible,
        checkedAt: Date.now(),
        discountPerUnit: 25000,
      })
    },
    [setPromotionStatus]
  )

  const clearPromotion = useCallback(() => {
    setPromotionStatus(null)
  }, [setPromotionStatus])

  const isEligible = promotionStatus?.isEligible ?? false
  const hasPromotion = promotionStatus !== null
  const promoPhone = promotionStatus?.phone ?? ''

  return {
    promotionStatus,
    setPromotion,
    clearPromotion,
    isEligible,
    hasPromotion,
    promoPhone,
  }
}
