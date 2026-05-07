import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BecomeVendorClient from './become-vendor-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Vendor',
  description: 'List your property, drive cabs, guide tours, or run a shop on GoMiGooo!',
}

export default async function BecomeVendorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/become-vendor')

  const { data } = await supabase.from('users').select('role, name, email').eq('id', user.id).single()
  const u = data as { role?: string; name?: string; email?: string } | null

  return <BecomeVendorClient currentRole={u?.role ?? 'customer'} userName={u?.name ?? ''} userEmail={u?.email ?? ''} />
}
