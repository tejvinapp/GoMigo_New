import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { Users, Building2, Package, Image, FileCheck, Settings, BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if ((userData as { role: string } | null)?.role !== 'admin') redirect('/explore')

  const [{ count: userCount }, { count: propertyCount }, { count: bookingCount }, { data: recentBookings }, { count: pendingKyc }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*, customer:customer_id(name), property:property_id(title)').order('created_at', { ascending: false }).limit(10),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('kyc_verified', false).neq('role', 'customer'),
  ])

  return (
    <div className="min-h-screen bg-warmwhite flex">
      <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col p-4 shrink-0">
        <Link href="/landing" className="font-serif text-xl font-bold text-forest-700 mb-4 block">GoMiGooo!</Link>
        <Badge className="mb-4 bg-red-50 text-red-700 border-red-200 text-xs w-fit">Admin Panel</Badge>
        <nav className="space-y-1">
          {[
            { href: '/admin/dashboard', icon: <BarChart2 className="w-4 h-4" />, label: 'Dashboard', active: true },
            { href: '/admin/users', icon: <Users className="w-4 h-4" />, label: 'Users' },
            { href: '/admin/subscriptions', icon: <Package className="w-4 h-4" />, label: 'Subscriptions' },
            { href: '/admin/photos', icon: <Image className="w-4 h-4" />, label: 'Photo Moderation' },
            { href: '/admin/kyc', icon: <FileCheck className="w-4 h-4" />, label: 'KYC Verification' },
            { href: '/admin/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${item.active ? 'bg-forest-700 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              {item.icon}{item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <h1 className="text-2xl font-serif font-bold mb-6">Admin Overview</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: userCount ?? 0, icon: <Users className="w-5 h-5" />, color: 'text-blue-700 bg-blue-50' },
            { label: 'Properties', value: propertyCount ?? 0, icon: <Building2 className="w-5 h-5" />, color: 'text-forest-700 bg-forest-50' },
            { label: 'Total Bookings', value: bookingCount ?? 0, icon: <Package className="w-5 h-5" />, color: 'text-purple-700 bg-purple-50' },
            { label: 'Pending KYC', value: pendingKyc ?? 0, icon: <FileCheck className="w-5 h-5" />, color: 'text-golden-700 bg-golden-50' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value.toLocaleString('en-IN')}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/subscriptions">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentBookings ?? []).map((b: { id: string; customer: { name: string | null } | null; property: { title: string } | null; total_amount: number; status: string }) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-sm">{b.customer?.name ?? 'Guest'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-28">{b.property?.title}</TableCell>
                      <TableCell><PriceDisplay amount={b.total_amount} size="sm" /></TableCell>
                      <TableCell><StatusBadge status={b.status as Parameters<typeof StatusBadge>[0]['status']} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { href: '/admin/settings', label: 'Configure Payment Settings (Razorpay)', desc: 'Add your Razorpay keys to enable bookings', urgent: true },
                { href: '/admin/settings', label: 'Configure Email Settings (Resend)', desc: 'Add Resend API key for booking notifications' },
                { href: '/admin/settings', label: 'Configure AI Settings (Claude)', desc: 'Add Anthropic API key for AI features' },
                { href: '/admin/kyc', label: 'Review Pending KYC Verifications', desc: `${pendingKyc ?? 0} owners awaiting verification` },
                { href: '/admin/photos', label: 'Moderate Property Photos', desc: 'Review flagged or disputed photos' },
              ].map(action => (
                <Link key={action.href + action.label} href={action.href} className="block p-3 rounded-xl border border-border hover:border-forest-700 hover:bg-forest-50 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground">{action.label}</div>
                    {action.urgent && <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Action needed</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.desc}</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
