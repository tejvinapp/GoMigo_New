import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ListingFormClient from '../../listing-form-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Listing' }

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (!property) notFound()

  return <ListingFormClient mode="edit" initialData={property} />
}
