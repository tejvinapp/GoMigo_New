import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OwnerVendorClient from '../shared/owner-vendor-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cab Driver Dashboard' }

export default async function CabsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/owner/cabs')

  const { data: userData } = await supabase
    .from('users')
    .select('role, name, email, kyc_verified')
    .eq('id', user.id)
    .single()

  const u = userData as { role?: string; name?: string; email?: string; kyc_verified?: boolean } | null
  if (!u) redirect('/auth')
  if (u.role !== 'cab_owner' && u.role !== 'admin') redirect('/become-vendor')

  const { data: cabs } = await supabase
    .from('cabs')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <OwnerVendorClient
      role="cab_owner"
      user={{ name: u.name ?? '', email: u.email ?? '', kycVerified: u.kyc_verified ?? false }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items={(cabs ?? []) as any}
    />
  )
}
