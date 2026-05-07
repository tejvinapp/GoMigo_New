import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ListingFormClient from '../listing-form-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add New Listing' }

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !['hotel_owner', 'admin'].includes(userData.role)) redirect('/owner/dashboard')

  return <ListingFormClient mode="create" />
}
