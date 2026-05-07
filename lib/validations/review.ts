import { z } from 'zod'

export const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  property_id: z.string().uuid(),
  overall_rating: z.number().int().min(1).max(5),
  cleanliness_rating: z.number().int().min(1).max(5).optional(),
  accuracy_rating: z.number().int().min(1).max(5).optional(),
  location_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).optional(),
})

export type ReviewInput = z.infer<typeof reviewSchema>
