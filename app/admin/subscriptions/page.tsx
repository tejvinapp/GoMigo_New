import { createClient } from '@/lib/supabase/server'
import SubscriptionsClient from './subscriptions-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin · Subscriptions' }
export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()
  const { data: subs } = await supabase
    .from('subscriptions')
    .select(`
      *,
      owner:owner_id(id, name, email, phone)
    `)
    .order('created_at', { ascending: false })

  return <SubscriptionsClient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialSubs={(subs ?? []) as any[]}
  />
}
