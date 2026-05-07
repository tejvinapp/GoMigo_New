'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { toast } from 'sonner'
import { Loader2, SkipForward, Compass } from 'lucide-react'

export default function OnboardingPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // If user already finished onboarding, send them to /explore
  useEffect(() => {
    if (!user) return
    supabase.from('users').select('onboarding_done, role').eq('id', user.id).single()
      .then(({ data }) => {
        const u = data as { onboarding_done?: boolean; role?: string } | null
        if (u?.onboarding_done) {
          if (u.role === 'admin') router.replace('/admin/dashboard')
          else router.replace('/explore')
        } else {
          setChecking(false)
        }
      })
  }, [user, supabase, router])

  async function complete(skipPhone = false) {
    if (!user) return
    if (!skipPhone && !phone.match(/^[0-9]{10}$/)) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({ phone: skipPhone ? null : '+91' + phone, onboarding_done: true })
      .eq('id', user.id)
    setLoading(false)
    if (error) { toast.error('Something went wrong, please try again'); return }
    toast.success('Welcome to GoMiGooo!')
    router.push('/explore')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warmwhite flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="font-serif text-xl font-bold text-forest-700 dark:text-forest-400">GoMiGooo!</Link>
        <ThemeToggle />
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-forest-100 dark:bg-forest-950 flex items-center justify-center">
              <Compass className="w-8 h-8 text-forest-700 dark:text-forest-400" />
            </div>
            <h1 className="font-serif text-3xl font-bold mb-2">Welcome aboard!</h1>
            <p className="text-muted-foreground text-sm">Just one quick thing to make booking smoother</p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Your mobile number</Label>
              <p className="text-xs text-muted-foreground mb-2">Hosts and guides will use this to reach you about your bookings.</p>
              <div className="flex gap-2 mt-1">
                <div className="flex items-center px-3 border border-border rounded-lg bg-muted text-muted-foreground text-sm">+91</div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 h-11"
                  maxLength={10}
                />
              </div>
            </div>

            <Button
              onClick={() => complete(false)}
              disabled={loading || phone.length !== 10}
              className="w-full h-11 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-medium"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save and continue
            </Button>

            <button
              onClick={() => complete(true)}
              disabled={loading}
              className="w-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />Skip for now
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
