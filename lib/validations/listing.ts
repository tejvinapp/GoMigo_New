import { z } from 'zod'

export const listingSchema = z.object({
  type: z.enum(['hotel', 'cottage', 'homestay', 'resort', 'camping']),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  price_per_night: z.number().min(100).max(100000),
  location: z.string().min(5).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  amenities: z.array(z.string()).max(30),
  max_guests: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, 'Invalid phone number').optional(),
})

export type ListingInput = z.infer<typeof listingSchema>
