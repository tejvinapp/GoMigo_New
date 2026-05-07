import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ListingDetailClient from './listing-detail-client'
import { fetchNearbyAttractions } from '@/lib/utils/geo'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('properties').select('title, city, state, description').eq('id', id).single()
  if (!data) return { title: 'Property Not Found' }
  return {
    title: `${data.title} — ${data.city}, ${data.state}`,
    description: data.description ?? `Book ${data.title} in ${data.city}, ${data.state}`,
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: property }, { data: images }, { data: reviews }] = await Promise.all([
    supabase.from('properties').select('*').eq('id', id).eq('status', 'active').single(),
    supabase.from('property_images').select('*').eq('property_id', id).order('is_official', { ascending: false }).order('sort_order'),
    supabase.from('reviews').select('*, reviewer:reviewer_id(name, avatar_url)').eq('property_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!property) notFound()

  // Increment view count (fire and forget)
  supabase.from('properties').update({ view_count: (property.view_count ?? 0) + 1 }).eq('id', id).then(() => {})

  // Fetch nearby attractions from OpenStreetMap
  const nearby = await fetchNearbyAttractions(property.lat, property.lng, 5000)

  // Get platform settings for advance % and payment
  const { data: settingsData } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['advance_payment_percent', 'feature_online_booking', 'feature_upi_payment', 'razorpay_key_id'])

  const settings = Object.fromEntries((settingsData ?? []).map(s => [s.key, s.value ?? '']))

  return (
    <ListingDetailClient
      property={property}
      images={images ?? []}
      reviews={(reviews ?? []) as Parameters<typeof ListingDetailClient>[0]['reviews']}
      nearby={nearby}
      settings={settings}
    />
  )
}
