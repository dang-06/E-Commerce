'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

interface PromotionStatusBadgeProps {
  isEligible: boolean
  phone?: string
}

export default function PromotionStatusBadge({
  isEligible,
  phone,
}: PromotionStatusBadgeProps) {
  if (!phone) return null

  const maskedPhone = formatPhoneNumber(phone, true)

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
        isEligible
          ? 'bg-secondary/10 text-secondary'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      {isEligible ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>Ưu đãi: {maskedPhone}</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>Không ưu đãi: {maskedPhone}</span>
        </>
      )}
    </div>
  )
}
