import { maskPhoneNumber } from '@/lib/utils/vietnamese'

interface PhoneMaskProps {
  phone: string
  showFull?: boolean
  className?: string
  title?: boolean
}

export function PhoneMask({ phone, showFull = false, className = '', title = true }: PhoneMaskProps) {
  const displayPhone = showFull ? phone : maskPhoneNumber(phone)

  return (
    <span className={className} title={title ? phone : undefined}>
      {displayPhone}
    </span>
  )
}
