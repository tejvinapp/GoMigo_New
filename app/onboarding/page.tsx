'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mountain, Car, Compass, ShoppingBag, User } from 'lucide-react'
import type { UserRole } from '@/types/database'

type Step = 'role' | 'phone' | 'done'

const ROLE_OPTIONS: { role: UserRole; icon: React.ReactNode; title: string; desc: string }[] = [
  { role: 'customer', icon: <Compass className="w-6 h-6" />, title: 'Traveler', desc: 'I want to explore stays, guides & experiences' },
  { role: 'hotel_owner', icon: <Mountain className="w-6 h-6" />, title: 'Hotel / Cottage Owner', desc: 'I have a property to list' },
  { role: 'cab_owner', icon: <Car className="w-6 h-6" />, title: 'Cab / Driver', desc: 'I offer transportation services' },
  { role: 'guide', icon: <User className="w-6 h-6" />, title: 'Tour Guide', desc: 'I lead tours and experiences' },
  { role: 'shop_owner', icon: <ShoppingBag className="w-6 h-6" />, title: 'Shop Owner', desc: 'I run a local shop or service' },
]

export default function OnboardingPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRoleSelect(role: UserRole) {
    setSelectedRole(role)
    setStep('phone')
  }

  async function handleComplete() {
    if (!user) return
    if (!phone.match(/^\+?[0-9]{10,13}$/)) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('users')
      .update({ role: selectedRole, phone, onboarding_done: true })
      .eq('id', user.id)

    if (error) {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    toast.success('Welcome to GoMiGooo!')
    // Redirect based on role
    if (selectedRole === 'customer') {
      router.push('/explore')
    } else {
      router.push('/owner/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-warmwhite flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-forest-700">GoMiGooo!</h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {['role', 'phone'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s ? 'bg-forest-700 text-white' :
                  (step === 'phone' && s === 'role') || step === 'done' ? 'bg-forest-200 text-forest-700' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                {i < 1 && <div className={`w-8 h-0.5 ${step !== 'role' ? 'bg-forest-700' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">
          {step === 'role' && (
            <>
              <h2 className="text-xl font-serif font-semibold text-center mb-2">How will you use GoMiGooo!?</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">Choose your primary role (you can always change later)</p>
              <div className="space-y-3">
                {ROLE_OPTIONS.map(({ role, icon, title, desc }) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-forest-700 hover:bg-forest-50 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-forest-50 group-hover:bg-forest-100 flex items-center justify-center text-forest-700 shrink-0 transition-colors">
                      {icon}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{title}</div>
                      <div className="text-sm text-muted-foreground">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'phone' && (
            <>
              <h2 className="text-xl font-serif font-semibold text-center mb-2">Your contact number</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                This allows property owners and guides to reach you directly
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center px-3 border border-border rounded-lg bg-muted text-muted-foreground text-sm">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 h-11"
                      maxLength={10}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleComplete}
                  disabled={loading || phone.length < 10}
                  className="w-full h-11 bg-forest-700 hover:bg-forest-800 text-white rounded-xl"
                >
                  {loading ? 'Setting up...' : "Let's go! →"}
                </Button>
                <button
                  onClick={() => setStep('role')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
