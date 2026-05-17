import { createClient } from '@/lib/supabase/server'
import UsersClient from './users-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin · Users' }
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; page?: string; q?: string }>
}) {
  const params = await searchParams
  const roleFilter = params.role ?? 'all'
  const pageNum = Math.max(0, parseInt(params.page ?? '0', 10) || 0)
  const PAGE_SIZE = 20

  const supabase = await createClient()

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

  if (roleFilter !== 'all') query = query.eq('role', roleFilter)

  const { data: users, count } = await query

  return (
    <UsersClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialUsers={(users ?? []) as any[]}
      totalCount={count ?? 0}
      currentPage={pageNum}
      pageSize={PAGE_SIZE}
      currentRoleFilter={roleFilter}
      currentSearch={params.q ?? ''}
    />
  )
}
