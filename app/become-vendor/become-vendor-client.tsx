'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { toast } from 'sonner'
import { ArrowLeft, Mountain, Car, Compass, ShoppingBag, Loader2, CheckCircle2, Sparkles } from 'lucide-react'

const ROLES = [
  {
    role: 'hotel_owner',
    title: 'Hotel / Cottage / Homestay Owner',
    desc: 'List your property, set your price, manage bookings. Pay only ₹299/mo. Zero commission.',
    icon: Mountain,
    dashboard: '/owner/dashboard',
    pitch: ['List unlimited photos & rooms', 'Get direct WhatsApp leads', 'Set your own prices'],
  },
  {
    role: 'cab_owner',
    title: 'Cab Driver / Operator',
    desc: 'Offer rides to travelers across hill stations and within town.',
    icon: Car,
    dashboard: '/owner/cabs',
    pitch: ['List multiple vehicles', 'Set per-km and per-day rates', 'Get airport pickup requests'],
  },
  {
    role: 'guide',
    title: 'Tour Guide',
    desc: 'Share your local expertise with travelers looking for authentic experiences.',
    icon: Compass,
    dashboard: '/owner/guides',
    pitch: ['Highlight your specialties', 'List multilingual capability', 'Build a verified profile'],
  },
  {
    role: 'shop_owner',
    title: 'Shop / Service Owner',
    desc: 'Local crafts, café, equipment rental — get on the map for travelers nearby.',
    icon: ShoppingBag,
    dashboard: '/owner/shops',
    pitch: ['Pin your shop on the map', 'Promote special offers', 'Connect with travelers'],
  },
]

export default function BecomeVendorClient({ currentRole, userEmail }: { currentRole: string; userName: string; userEmail: string }) {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function applyRole(role: string, dashboard: string) {
    if (!user) return
    // Safeguard: don't let admins accidentally downgrade themselves
    if (currentRole === 'admin') {
      const ok = confirm(
        'You are currently an ADMIN. Switching to ' + role.replace('_', ' ') +
        ' will REMOVE your admin access. Are you sure?\n\n' +
        '(You can restore admin via the Supabase dashboard or another admin can restore you.)'
      )
      if (!ok) return
    }
    setSubmitting(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({ role })
      .eq('id', user.id)
    setSubmitting(false)
    if (error) { toast.error('Could not update your account, please try again'); return }
    toast.success('Welcome aboard! Setting up your dashboard...')
    setTimeout(() => router.push(dashboard), 600)
  }

  const isAlreadyVendor = currentRole !== 'customer' && currentRole !== 'admin'

  return (
    <div className="min-h-screen bg-warmwhite">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/explore"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
            </Button>
            <Link href="/" className="font-serif text-lg font-bold text-forest-700 dark:text-forest-400">GoMiGooo!</Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-12 pb-8 text-center max-w-3xl mx-auto">
        <Badge className="mb-4 bg-golden-50 dark:bg-golden-950/40 text-golden-700 dark:text-golden-400 border-golden-200 dark:border-golden-800">
          <Sparkles className="w-3 h-3 mr-1" />Zero Commission Forever
        </Badge>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-balance">
          Join GoMiGooo! as a <span className="text-forest-700 dark:text-forest-400">vendor</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto text-balance">
          Reach travelers directly. Set your own prices. Keep 100% of every booking. Pay just a small monthly subscription.
        </p>
        {isAlreadyVendor && (
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            You&apos;re already registered as <strong className="font-semibold">{currentRole.replace('_', ' ')}</strong>
          </div>
        )}
      </section>

      {/* Role grid */}
      <section className="px-4 pb-16 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          {ROLES.map(r => {
            const isCurrent = currentRole === r.role
            const isSelected = selected === r.role
            return (
              <Card
                key={r.role}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-forest-700 dark:ring-forest-400 shadow-lg' :
                  isCurrent ? 'ring-2 ring-green-500/40' : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
                onClick={() => setSelected(r.role)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center text-forest-700 dark:text-forest-400 shrink-0">
                      <r.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg font-semibold leading-tight">{r.title}</h3>
                      {isCurrent && (
                        <Badge className="mt-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{r.desc}</p>
                  <ul className="space-y-1 text-xs text-muted-foreground mb-4">
                    {r.pitch.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400 shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button asChild className="w-full bg-forest-700 hover:bg-forest-800 text-white">
                      <Link href={r.dashboard}>Open my dashboard</Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => { e.stopPropagation(); applyRole(r.role, r.dashboard) }}
                      disabled={submitting}
                      className="w-full bg-forest-700 hover:bg-forest-800 text-white"
                    >
                      {submitting && selected === r.role ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {currentRole === 'customer' ? 'Sign me up' : 'Switch to this'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Signed in as {userEmail} · You can change your vendor type anytime
        </p>
      </section>
    </div>
  )
}
