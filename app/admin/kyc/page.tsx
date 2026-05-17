import { createClient } from '@/lib/supabase/server'
import KycClient from './kyc-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin · KYC Verification' }
export const dynamic = 'force-dynamic'

export default async function AdminKycPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .not('role', 'eq', 'customer')
    .not('role', 'eq', 'admin')
    .order('created_at', { ascending: false })

  return <KycClient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialUsers={(users ?? []) as any[]}
  />
}
