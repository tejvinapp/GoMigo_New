'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserRow = any

interface Props {
  initialUsers: UserRow[]
  totalCount: number
  currentPage: number
  pageSize: number
  currentRoleFilter: string
  currentSearch: string
}

export default function UsersClient({
  initialUsers, totalCount, currentPage, pageSize, currentRoleFilter, currentSearch,
}: Props) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const searchParamsHook = useSearchParams()
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState(currentSearch)

  function navigate(updates: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParamsHook.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') sp.delete(k)
      else sp.set(k, v)
    })
    router.push(`${pathname}?${sp.toString()}`)
  }

  const filteredUsers = searchTerm
    ? users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users

  async function updateRole(userId: string, newRole: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any).update({ role: newRole }).eq('id', userId)
    if (error) { toast.error('Failed to update role: ' + error.message); return }
    toast.success('Role updated')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  async function toggleKyc(userId: string, current: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any).update({ kyc_verified: !current }).eq('id', userId)
    if (error) { toast.error('Failed: ' + error.message); return }
    toast.success(current ? 'KYC unverified' : 'KYC verified')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_verified: !current } : u))
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-serif font-bold text-2xl">User Management</h1>
        <Badge variant="secondary">{totalCount} total</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email (this page)..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={currentRoleFilter}
          onValueChange={v => navigate({ role: v === 'all' ? null : v, page: null })}
        >
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
          <CardTitle className="text-base">Users ({filteredUsers.length} on page · {totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
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
        <Button variant="outline" size="sm" disabled={currentPage === 0}
          onClick={() => navigate({ page: String(currentPage - 1) })}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {Math.max(1, totalPages)}</span>
        <Button variant="outline" size="sm" disabled={currentPage + 1 >= totalPages}
          onClick={() => navigate({ page: String(currentPage + 1) })}>
          Next
        </Button>
      </div>
    </div>
  )
}
