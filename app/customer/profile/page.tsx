'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabase } from '@/components/providers'
import { toast } from 'sonner'

export default function CustomerProfilePage() {
  const { supabase, user: authUser } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (!authUser) return
    supabase.from('users').select('name, phone, avatar_url').eq('id', authUser.id).single()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? '')
          setPhone(data.phone ?? '')
          setAvatarUrl(data.avatar_url ?? '')
        }
      })
  }, [authUser, supabase])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!authUser) return
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq('id', authUser.id)
    setSaving(false)
    if (error) { toast.error('Failed to save'); return }
    toast.success('Profile updated!')
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-warmwhite">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customer/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
        </Button>
        <h1 className="font-serif font-bold text-lg">My Profile</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-3xl bg-forest-50 text-forest-700">
                {name?.[0] ?? authUser?.email?.[0] ?? 'T'}
              </AvatarFallback>
            </Avatar>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{authUser?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Google account · photo managed by Google</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <Button type="submit" className="w-full bg-forest-700 hover:bg-forest-800 text-white" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/customer/bookings">My Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/customer/dashboard">Saved Properties</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
