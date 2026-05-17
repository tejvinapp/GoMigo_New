'use client'

import { useState } from 'react'
import { Crown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabase } from '@/components/providers'
import { toast } from 'sonner'
import { format } from 'date-fns'

const planColors: Record<string, string> = {
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-green-100 text-green-700',
  premium: 'bg-yellow-100 text-yellow-700',
}
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
  trial: 'bg-purple-100 text-purple-700',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SubscriptionsClient({ initialSubs }: { initialSubs: any[] }) {
  const { supabase } = useSupabase()
  const [subs, setSubs] = useState(initialSubs)

  async function cancelSub(subId: string) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('subscriptions') as any)
      .update({ status: 'cancelled' })
      .eq('id', subId)
    if (error) { toast.error('Failed to cancel subscription'); return }
    toast.success('Subscription cancelled')
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: 'cancelled' } : s))
  }

  const stats = {
    active: subs.filter(s => s.status === 'active').length,
    past_due: subs.filter(s => s.status === 'past_due').length,
    revenue: subs.filter(s => s.status === 'active').reduce((acc, s) => acc + Number(s.amount), 0),
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-serif font-bold text-2xl mb-2">Subscriptions</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', value: stats.active, icon: Crown, color: 'text-green-600' },
          { label: 'Past Due', value: stats.past_due, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'MRR', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: Crown, color: 'text-forest-700 dark:text-forest-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Subscriptions ({subs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {subs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No subscriptions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {subs.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{s.owner?.name ?? 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{s.owner?.email}</div>
                    {s.razorpay_subscription_id && (
                      <div className="text-xs text-muted-foreground font-mono">{s.razorpay_subscription_id}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[s.plan] ?? ''}`}>{s.plan}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[s.status] ?? ''}`}>{s.status}</span>
                    <span className="text-sm font-medium text-forest-700 dark:text-forest-400">
                      ₹{Number(s.amount).toLocaleString('en-IN')}/mo
                    </span>
                    {s.current_period_end && (
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        Renews {format(new Date(s.current_period_end), 'dd MMM')}
                      </span>
                    )}
                    {s.status === 'active' && (
                      <Button size="sm" variant="outline"
                        className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => cancelSub(s.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
