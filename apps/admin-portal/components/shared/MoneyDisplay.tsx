import { formatVND } from '@/lib/utils/vietnamese'

interface MoneyDisplayProps {
  amount: number
  className?: string
  highlight?: boolean
}

export function MoneyDisplay({ amount, className = '', highlight = false }: MoneyDisplayProps) {
  return (
    <span className={`font-semibold ${highlight ? 'text-primary' : ''} ${className}`}>
      {formatVND(amount)}
    </span>
  )
}
