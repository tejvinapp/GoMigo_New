'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import { Activity, Search, Settings, UserCog, ShieldCheck, FileEdit } from 'lucide-react'

const ACTION_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  'setting.update': { icon: Settings, label: 'Setting changed', color: 'text-blue-600 bg-blue-50' },
  'user.role_change': { icon: UserCog, label: 'Role changed', color: 'text-purple-600 bg-purple-50' },
  'kyc.approve': { icon: ShieldCheck, label: 'KYC approved', color: 'text-green-600 bg-green-50' },
  'kyc.revoke': { icon: ShieldCheck, label: 'KYC revoked', color: 'text-red-600 bg-red-50' },
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialLogs: any[]
  currentActionFilter: string
}

export default function LogsClient({ initialLogs, currentActionFilter }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParamsHook = useSearchParams()
  const [search, setSearch] = useState('')

  function navigate(updates: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParamsHook.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === 'all') sp.delete(k)
      else sp.set(k, v)
    })
    router.push(`${pathname}?${sp.toString()}`)
  }

  const filtered = search
    ? initialLogs.filter(l =>
        l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        l.target_id?.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(l.metadata).toLowerCase().includes(search.toLowerCase())
      )
    : initialLogs

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-6 h-6 text-forest-700 dark:text-forest-400" />
        <h1 className="font-serif font-bold text-2xl">Activity Log</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Every admin action is logged here automatically — settings changes, role updates, KYC approvals, and more.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, target, or value..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={currentActionFilter} onValueChange={v => navigate({ action: v })}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="setting.update">Settings changes</SelectItem>
            <SelectItem value="user.role_change">Role changes</SelectItem>
            <SelectItem value="kyc.approve">KYC approvals</SelectItem>
            <SelectItem value="kyc.revoke">KYC revokes</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => router.refresh()}>Refresh</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Last {filtered.length} events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileEdit className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No activity yet</p>
              <p className="text-sm text-muted-foreground">Admin actions will appear here as they happen</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(log => {
                const meta = ACTION_META[log.action] ?? { icon: Activity, label: log.action, color: 'text-gray-600 bg-gray-50' }
                const Icon = meta.icon
                return (
                  <div key={log.id} className="p-4 hover:bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${meta.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{meta.label}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{log.user_email}</span>
                          <span className="text-xs text-muted-foreground" title={format(new Date(log.created_at), 'PPp')}>
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {log.target_id && (
                          <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
                            target: {log.target_id}
                          </div>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-1.5">
                            <summary className="text-xs text-forest-700 dark:text-forest-400 cursor-pointer hover:underline">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
