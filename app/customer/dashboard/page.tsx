import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerDashboardClient from './customer-dashboard-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Dashboard' }

export default async function CustomerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: userData }, { data: bookings }, { data: favorites }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select(`
      *,
      property:property_id(id, title, city, cover_image, phone, rating)
    `).eq('customer_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('favorites').select(`
      property_id,
      property:property_id(id, title, city, cover_image, price_per_night, rating, review_count, type, state, amenities, lat, lng, location, max_guests, bedrooms, bathrooms, description, status, owner_id, view_count, ai_description, phone, destination_id, created_at, updated_at)
    `).eq('user_id', user.id),
  ])

  return (
    <CustomerDashboardClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user={userData as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bookings={(bookings ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      favorites={((favorites ?? []) as any[]).map(f => f.property).filter(Boolean)}
    />
  )
}
