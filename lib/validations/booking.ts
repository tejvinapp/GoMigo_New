import { z } from 'zod'

export const bookingSchema = z.object({
  property_id: z.string().uuid(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  guests: z.number().int().min(1).max(20),
  special_requests: z.string().max(500).optional(),
}).refine(data => new Date(data.check_out) > new Date(data.check_in), {
  message: 'Check-out must be after check-in',
  path: ['check_out'],
})

export type BookingInput = z.infer<typeof bookingSchema>
