import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OwnerDashboardClient from './owner-dashboard-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Owner Dashboard' }

export default async function OwnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: userData }, { data: properties }, { data: bookings }, { data: subscription }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('properties').select('*, images:property_images(url, is_official)').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('bookings').select(`
      *, customer:customer_id(name, phone, avatar_url),
      property:property_id(title, cover_image)
    `).in('property_id', []).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*').eq('owner_id', user.id).single(),
  ])

  // Re-fetch bookings with actual property IDs
  const propertyIds = (properties ?? []).map(p => p.id)
  const { data: ownerBookings } = propertyIds.length > 0
    ? await supabase.from('bookings').select(`
        *, customer:customer_id(name, phone, avatar_url),
        property:property_id(title, cover_image)
      `).in('property_id', propertyIds).order('created_at', { ascending: false }).limit(50)
    : { data: [] }

  if (!userData || !['hotel_owner', 'cab_owner', 'guide', 'shop_owner'].includes(userData.role)) {
    redirect('/explore')
  }

  return (
    <OwnerDashboardClient
      user={userData}
      properties={properties ?? []}
      bookings={ownerBookings ?? []}
      subscription={subscription}
    />
  )
}
