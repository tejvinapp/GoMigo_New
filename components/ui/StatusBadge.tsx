import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/types/database'

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  advance_paid: { label: 'Paid', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
  checked_in: { label: 'Checked In', className: 'bg-forest-100 text-forest-800 border-forest-200' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
  refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-800 border-purple-200' },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <Badge className={`font-medium border ${config.className}`}>{config.label}</Badge>
  )
}
