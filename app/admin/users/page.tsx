'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Shield, Ban, CheckCircle, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSupabase } from '@/components/providers'
import { toast } from 'sonner'
import { format } from 'date-fns'

const ROLES = ['customer', 'hotel_owner', 'cab_owner', 'guide', 'shop_owner', 'admin']

const roleBadgeColor: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700',
  hotel_owner: 'bg-green-100 text-green-700',
  cab_owner: 'bg-yellow-100 text-yellow-700',
  guide: 'bg-purple-100 text-purple-700',
  shop_owner: 'bg-orange-100 text-orange-700',
  admin: 'bg-red-100 text-red-700',
}

export default function AdminUsersPage() {
  const { supabase, user: currentUser } = useSupabase()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, page])

  async function fetchUsers() {
    setLoading(true)
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (roleFilter !== 'all') query = query.eq('role', roleFilter)

    const { data, error } = await query
    if (!error) setUsers(data ?? [])
    setLoading(false)
  }

  const filteredUsers = search
    ? users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users

  async function updateRole(userId: string, newRole: string) {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
    if (error) { toast.error('Failed to update role'); return }
    toast.success('Role updated')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  async function toggleKyc(userId: string, current: boolean) {
    const { error } = await supabase.from('users').update({ kyc_verified: !current }).eq('id', userId)
    if (error) { toast.error('Failed to update KYC'); return }
    toast.success(current ? 'KYC unverified' : 'KYC verified')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_verified: !current } : u))
  }

  return (
    <div className="min-h-screen bg-warmwhite">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Admin</Link>
        </Button>
        <h1 className="font-serif font-bold text-lg">User Management</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={v => { setRoleFilter(v ?? 'all'); setPage(0) }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-4 hover:bg-muted/30">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={u.avatar_url ?? ''} />
                      <AvatarFallback className="bg-forest-50 text-forest-700">{u.name?.[0] ?? u.email?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{u.name ?? 'No name'}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      {u.phone && <div className="text-xs text-muted-foreground">{u.phone}</div>}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Joined {format(new Date(u.created_at), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.kyc_verified && (
                        <span title="KYC Verified"><CheckCircle className="w-4 h-4 text-green-600" /></span>
                      )}
                      <Select value={u.role} onValueChange={val => val && updateRole(u.id, val)}>
                        <SelectTrigger className="h-7 text-xs w-36">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleBadgeColor[u.role] ?? ''}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => (
                            <SelectItem key={r} value={r} className="text-xs">{r.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => toggleKyc(u.id, u.kyc_verified)}
                      >
                        {u.kyc_verified ? 'Unverify' : 'Verify KYC'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button variant="outline" size="sm" disabled={users.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
