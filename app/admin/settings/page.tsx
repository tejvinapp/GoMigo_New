import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSettingsClient from './admin-settings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Admin check
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if ((userData as { role: string } | null)?.role !== 'admin') redirect('/explore')

  // Fetch ALL settings (admin can see sensitive ones)
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .order('category')
    .order('key')

  return <AdminSettingsClient initialSettings={settings ?? []} />
}
