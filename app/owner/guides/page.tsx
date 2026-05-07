import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OwnerVendorClient from '../shared/owner-vendor-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tour Guide Dashboard' }

export default async function GuidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/owner/guides')

  const { data: userData } = await supabase
    .from('users')
    .select('role, name, email, kyc_verified')
    .eq('id', user.id)
    .single()

  const u = userData as { role?: string; name?: string; email?: string; kyc_verified?: boolean } | null
  if (!u) redirect('/auth')
  if (u.role !== 'guide' && u.role !== 'admin') redirect('/become-vendor')

  const { data: guides } = await supabase
    .from('guides')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <OwnerVendorClient
      role="guide"
      user={{ name: u.name ?? '', email: u.email ?? '', kycVerified: u.kyc_verified ?? false }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items={(guides ?? []) as any}
    />
  )
}
