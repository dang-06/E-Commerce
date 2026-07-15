import { Card } from '@/components/ui/card'
import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

const variantStyles = {
  default: 'bg-white border-gray-200',
  primary: 'bg-primary/5 border-primary/20',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-amber-50 border-amber-200',
  error: 'bg-red-50 border-red-200',
}

export function MetricCard({ label, value, icon, variant = 'default' }: MetricCardProps) {
  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        </div>
        {icon && <div className="text-3xl opacity-20">{icon}</div>}
      </div>
    </Card>
  )
}
