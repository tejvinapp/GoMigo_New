import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RatingStars({ rating, count, size = 'sm', className }: Props) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <span className={cn('flex items-center gap-1', className)}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn(sizeClass, i <= Math.round(rating) ? 'fill-golden-400 text-golden-400' : 'text-gray-200 fill-gray-200')}
          />
        ))}
      </span>
      <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  )
}
