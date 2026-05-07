import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminHeader from './admin-header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: userData } = await supabase
    .from('users')
    .select('role, name, email, avatar_url')
    .eq('id', user.id)
    .single()

  const u = userData as { role?: string; name?: string; email?: string; avatar_url?: string } | null
  if (u?.role !== 'admin') redirect('/explore')

  return (
    <div className="min-h-screen bg-warmwhite">
      <AdminHeader name={u?.name ?? null} email={u?.email ?? ''} avatarUrl={u?.avatar_url ?? null} />
      {children}
    </div>
  )
}
