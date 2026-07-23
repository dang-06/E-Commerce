import { Card } from '@/components/ui/card'
import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'violet'
}

const variantStyles = {
  default: 'bg-card',
  primary: 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
  error: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
  info: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100',
  violet: 'border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100',
}

const mutedLabelStyles = {
  default: 'text-muted-foreground',
  primary: 'text-sky-700 dark:text-sky-200/80',
  success: 'text-emerald-700 dark:text-emerald-200/80',
  warning: 'text-amber-700 dark:text-amber-200/80',
  error: 'text-rose-700 dark:text-rose-200/80',
  info: 'text-blue-700 dark:text-blue-200/80',
  violet: 'text-violet-700 dark:text-violet-200/80',
}

const iconStyles = {
  default: 'bg-muted text-foreground',
  primary: 'border-sky-200 bg-white/70 text-sky-700 dark:border-sky-400/30 dark:bg-sky-950/50 dark:text-sky-200',
  success:
    'border-emerald-200 bg-white/70 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-950/50 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-white/70 text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/50 dark:text-amber-200',
  error: 'border-rose-200 bg-white/70 text-rose-700 dark:border-rose-400/30 dark:bg-rose-950/50 dark:text-rose-200',
  info: 'border-blue-200 bg-white/70 text-blue-700 dark:border-blue-400/30 dark:bg-blue-950/50 dark:text-blue-200',
  violet:
    'border-violet-200 bg-white/70 text-violet-700 dark:border-violet-400/30 dark:bg-violet-950/50 dark:text-violet-200',
}

export function MetricCard({ label, value, icon, variant = 'default' }: MetricCardProps) {
  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex min-h-20 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${mutedLabelStyles[variant]}`}>{label}</p>
          <p className="mt-3 truncate text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        {icon ? (
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${iconStyles[variant]}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
