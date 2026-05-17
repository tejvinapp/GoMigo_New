import { createClient } from '@/lib/supabase/server'
import LogsClient from './logs-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin · Activity Log' }
export const dynamic = 'force-dynamic'

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>
}) {
  const params = await searchParams
  const actionFilter = params.action ?? 'all'

  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (actionFilter !== 'all') query = query.eq('action', actionFilter)

  const { data: logs } = await query

  return (
    <LogsClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialLogs={(logs ?? []) as any[]}
      currentActionFilter={actionFilter}
    />
  )
}
