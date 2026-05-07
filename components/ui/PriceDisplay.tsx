import { cn } from '@/lib/utils'

interface Props {
  amount: number
  suffix?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceDisplay({ amount, suffix, className, size = 'md' }: Props) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

  const sizeClass = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'

  return (
    <span className={cn('font-semibold text-forest-700', sizeClass, className)}>
      {formatted}
      {suffix && <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}
    </span>
  )
}
