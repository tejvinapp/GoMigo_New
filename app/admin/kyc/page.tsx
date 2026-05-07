'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, ExternalLink, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSupabase } from '@/components/providers'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminKycPage() {
  const { supabase } = useSupabase()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [docUrls, setDocUrls] = useState<Record<string, string[]>>({})

  useEffect(() => {
    fetchPendingKyc()
  }, [])

  async function fetchPendingKyc() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .not('role', 'eq', 'customer')
      .not('role', 'eq', 'admin')
      .order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  async function loadDocs(userId: string) {
    if (docUrls[userId]) return
    const { data } = await supabase.storage
      .from('kyc-documents')
      .list(`kyc/${userId}`, { limit: 10 })

    if (data && data.length > 0) {
      const urls = await Promise.all(
        data.map(async (file) => {
          const { data: signedData } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(`kyc/${userId}/${file.name}`, 3600)
          return signedData?.signedUrl ?? ''
        })
      )
      setDocUrls(prev => ({ ...prev, [userId]: urls.filter(Boolean) }))
    } else {
      setDocUrls(prev => ({ ...prev, [userId]: [] }))
    }
  }

  async function approveKyc(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any).update({ kyc_verified: true }).eq('id', userId)
    if (error) { toast.error('Failed'); return }
    toast.success('KYC verified')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_verified: true } : u))
  }

  async function revokeKyc(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any).update({ kyc_verified: false }).eq('id', userId)
    if (error) { toast.error('Failed'); return }
    toast.success('KYC revoked')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_verified: false } : u))
  }

  const pending = users.filter(u => !u.kyc_verified)
  const verified = users.filter(u => u.kyc_verified)

  return (
    <div className="min-h-screen bg-warmwhite">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Admin</Link>
        </Button>
        <h1 className="font-serif font-bold text-lg">KYC Verification</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{pending.length}</div>
                <div className="text-xs text-muted-foreground">Pending Verification</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{verified.length}</div>
                <div className="text-xs text-muted-foreground">Verified Owners</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {pending.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Pending Verification</h2>
            <div className="space-y-3">
              {pending.map(u => (
                <KycCard
                  key={u.id}
                  user={u}
                  docs={docUrls[u.id]}
                  onLoadDocs={loadDocs}
                  onApprove={approveKyc}
                  onRevoke={revokeKyc}
                />
              ))}
            </div>
          </div>
        )}

        {verified.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Verified</h2>
            <div className="space-y-3">
              {verified.map(u => (
                <KycCard
                  key={u.id}
                  user={u}
                  docs={docUrls[u.id]}
                  onLoadDocs={loadDocs}
                  onApprove={approveKyc}
                  onRevoke={revokeKyc}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && users.length === 0 && (
          <Card className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold">No owner accounts yet</h3>
            <p className="text-sm text-muted-foreground">Owners will appear here when they sign up</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function KycCard({ user, docs, onLoadDocs, onApprove, onRevoke }: {
  user: any
  docs?: string[]
  onLoadDocs: (id: string) => void
  onApprove: (id: string) => void
  onRevoke: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  function toggle() {
    setExpanded(e => !e)
    if (!expanded) onLoadDocs(user.id)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={user.avatar_url ?? ''} />
            <AvatarFallback className="bg-forest-50 text-forest-700">{user.name?.[0] ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{user.name ?? 'No name'}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
            <div className="text-xs text-muted-foreground">
              {user.role.replace('_', ' ')} · Joined {format(new Date(user.created_at), 'dd MMM yyyy')}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user.kyc_verified ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300" onClick={() => onRevoke(user.id)}>
                  Revoke
                </Button>
              </>
            ) : (
              <Button size="sm" className="h-7 text-xs bg-forest-700 hover:bg-forest-800 text-white" onClick={() => onApprove(user.id)}>
                Approve KYC
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={toggle}>
              <FileText className="w-3 h-3 mr-1" />Docs
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border">
            {docs === undefined ? (
              <div className="text-xs text-muted-foreground">Loading documents...</div>
            ) : docs.length === 0 ? (
              <div className="text-xs text-muted-foreground">No documents uploaded</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {docs.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-forest-700 hover:underline bg-forest-50 px-2 py-1 rounded"
                  >
                    <FileText className="w-3 h-3" />
                    Document {i + 1}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
