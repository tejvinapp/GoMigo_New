import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ExploreClient from './explore-client'

export const metadata: Metadata = {
  title: 'Explore — Stays, Guides & Cabs in India',
  description: 'Discover authentic hotels, cottages, homestays, guides and cabs across Indian hill stations. Book directly with zero commission.',
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; destination?: string; min?: string; max?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select(`
      *,
      images:property_images(url, is_official, sort_order)
    `)
    .eq('status', 'active')
    .order('rating', { ascending: false })
    .limit(50)

  if (params.type && params.type !== 'all') query = query.eq('type', params.type)
  if (params.destination) query = query.ilike('city', `%${params.destination}%`)
  if (params.q) query = query.or(`title.ilike.%${params.q}%,city.ilike.%${params.q}%,state.ilike.%${params.q}%`)
  if (params.min) query = query.gte('price_per_night', parseFloat(params.min))
  if (params.max) query = query.lte('price_per_night', parseFloat(params.max))

  const { data: properties } = await query

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedProperties = ((properties ?? []) as any[]).map(p => ({
    ...p,
    images: (p.images || []).sort((a: { sort_order: number; is_official: boolean }, b: { sort_order: number; is_official: boolean }) => {
      if (a.is_official !== b.is_official) return a.is_official ? -1 : 1
      return a.sort_order - b.sort_order
    }),
  }))

  return (
    <ExploreClient
      properties={normalizedProperties}
      initialFilters={{
        q: params.q ?? '',
        type: params.type ?? 'all',
        destination: params.destination ?? '',
      }}
    />
  )
}
