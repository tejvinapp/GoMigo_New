import { createClient } from '@/lib/supabase/server'
import PhotosClient from './photos-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin · Photo Moderation' }
export const dynamic = 'force-dynamic'

export default async function AdminPhotosPage() {
  const supabase = await createClient()
  const { data: photos } = await supabase
    .from('property_images')
    .select(`*, property:property_id(id, title, city)`)
    .order('created_at', { ascending: false })
    .limit(100)

  return <PhotosClient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialPhotos={(photos ?? []) as any[]}
  />
}
