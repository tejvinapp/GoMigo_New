'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { toast } from 'sonner'
import { ArrowLeft, Car, Compass, ShoppingBag, Plus, LogOut, Sparkles, Phone, Mail, AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react'

type Role = 'cab_owner' | 'guide' | 'shop_owner'

const ROLE_META: Record<Role, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  itemSingular: string
  itemPlural: string
  emptyTitle: string
  emptyDesc: string
  description: string
}> = {
  cab_owner: {
    icon: Car,
    label: 'Cab Driver',
    itemSingular: 'vehicle',
    itemPlural: 'vehicles',
    emptyTitle: 'List your first vehicle',
    emptyDesc: 'Add your car details and pricing so travelers can find you for airport pickups, day trips, and intercity rides.',
    description: 'Manage your vehicles, set pricing, and accept ride requests.',
  },
  guide: {
    icon: Compass,
    label: 'Tour Guide',
    itemSingular: 'tour package',
    itemPlural: 'tour packages',
    emptyTitle: 'Create your guide profile',
    emptyDesc: 'Tell travelers about your specialties, languages, and experience. Build a verified profile that stands out.',
    description: 'Manage your guide profile, specialties, and tour packages.',
  },
  shop_owner: {
    icon: ShoppingBag,
    label: 'Shop Owner',
    itemSingular: 'shop',
    itemPlural: 'shops',
    emptyTitle: 'List your first shop',
    emptyDesc: 'Pin your shop on the map and let nearby travelers discover what you sell.',
    description: 'Manage your shops, hours, and special offers.',
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = any

interface Props {
  role: Role
  user: { name: string; email: string; kycVerified: boolean }
  items: Item[]
}

export default function OwnerVendorClient({ role, user, items }: Props) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const meta = ROLE_META[role]
  const Icon = meta.icon

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state — supports all 3 vendor types
  const [name, setName] = useState('')
  const [vehicleType, setVehicleType] = useState('Sedan')
  const [seats, setSeats] = useState('4')
  const [hasAc, setHasAc] = useState(true)
  const [pricePerKm, setPricePerKm] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  // Guide-specific
  const [specialties, setSpecialties] = useState('')
  const [languages, setLanguages] = useState('English, Hindi, Tamil')
  const [experienceYears, setExperienceYears] = useState('')
  const [bio, setBio] = useState('')
  // Shop-specific
  const [shopType, setShopType] = useState('Crafts')
  const [city, setCity] = useState('')
  const [hours, setHours] = useState('10am – 7pm')
  const [description, setDescription] = useState('')

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function resetForm() {
    setName(''); setVehicleType('Sedan'); setSeats('4'); setHasAc(true)
    setPricePerKm(''); setPricePerDay(''); setRegistrationNumber('')
    setSpecialties(''); setLanguages('English, Hindi, Tamil'); setExperienceYears(''); setBio('')
    setShopType('Crafts'); setCity(''); setHours('10am – 7pm'); setDescription('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { toast.error('Please sign in again'); return }

    let payload: Record<string, unknown>
    let table: string

    if (role === 'cab_owner') {
      table = 'cabs'
      payload = {
        owner_id: authUser.id,
        vehicle_type: vehicleType,
        vehicle_name: registrationNumber.trim().toUpperCase(),  // schema column is `vehicle_name`
        seats: parseInt(seats),
        ac: hasAc,                                              // schema column is `ac`, not `has_ac`
        price_per_km: parseFloat(pricePerKm) || 0,
        price_per_day: parseFloat(pricePerDay) || 0,
        city: 'Ooty',
        lat: 11.4102,
        lng: 76.6950,
      }
    } else if (role === 'guide') {
      table = 'guides'
      payload = {
        owner_id: authUser.id,                                  // schema column is `owner_id`, not `user_id`
        name: name.trim() || (specialties.split(',')[0]?.trim() || 'Local Guide'),
        bio: bio.trim() + (experienceYears ? `\n\n${experienceYears} years experience.` : ''),
        specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
        languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        price_per_day: parseFloat(pricePerDay) || 0,
      }
    } else {
      table = 'shops'
      payload = {
        owner_id: authUser.id,
        name: name.trim(),
        type: shopType,                                          // schema column is `type`, not `shop_type`
        description: description.trim(),
        location: city.trim() || 'Ooty',
        lat: 11.4102,
        lng: 76.6950,
        city: city.trim() || 'Ooty',
        timings: hours,                                          // schema column is `timings`, not `hours`
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any).insert(payload)
    setSubmitting(false)
    if (error) { toast.error('Failed to save: ' + error.message); return }
    toast.success(`${meta.itemSingular} added!`)
    resetForm()
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-warmwhite">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/explore"><ArrowLeft className="w-4 h-4 mr-1" />Explore</Link>
            </Button>
            <Link href="/" className="font-serif text-lg font-bold text-forest-700 dark:text-forest-400 truncate">GoMiGooo!</Link>
            <Badge className="bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-400 border-forest-200 dark:border-forest-900 text-xs hidden sm:inline-flex">
              <Icon className="w-3 h-3 mr-1" />{meta.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/become-vendor">Switch role</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-forest-100 dark:bg-forest-950 text-forest-700 dark:text-forest-400 text-lg">
              {(user.name?.[0] ?? user.email[0])?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-serif font-bold leading-tight">
              {user.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Welcome'}
            </h1>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>
        </div>

        {/* KYC banner */}
        {!user.kycVerified && (
          <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
            <CardContent className="p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm">KYC verification pending</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your profile is visible but bookings are limited until our team verifies your documents.
                  Upload them in your profile to speed this up.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {user.kycVerified && (
          <Card className="border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <div className="text-sm font-medium">KYC verified — your profile is fully active</div>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold">
              Your {meta.itemPlural}
              <span className="ml-2 text-sm text-muted-foreground font-normal">({items.length})</span>
            </h2>
            <Button
              size="sm"
              className="bg-forest-700 hover:bg-forest-800 text-white"
              onClick={() => setShowForm(s => !s)}
            >
              <Plus className="w-4 h-4 mr-1" />
              {showForm ? 'Cancel' : `Add ${meta.itemSingular}`}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">New {meta.itemSingular}</CardTitle>
                <CardDescription>Fill in the details below. You can edit later.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {role === 'cab_owner' && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Vehicle Type</Label>
                          <select
                            value={vehicleType}
                            onChange={e => setVehicleType(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                          >
                            {['Sedan', 'SUV', 'Hatchback', 'Tempo Traveller', 'Innova', 'Etios'].map(v => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="seats">Seats</Label>
                          <Input id="seats" type="number" min="2" max="20" value={seats} onChange={e => setSeats(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reg">Vehicle Name / Registration #</Label>
                        <Input id="reg" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="TN 43 AB 1234 or 'My Innova'" required />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ppk">Price per KM (₹)</Label>
                          <Input id="ppk" type="number" step="0.5" value={pricePerKm} onChange={e => setPricePerKm(e.target.value)} placeholder="14" required />
                        </div>
                        <div>
                          <Label htmlFor="ppd">Price per Day (₹)</Label>
                          <Input id="ppd" type="number" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} placeholder="2500" required />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <Label>Air Conditioning</Label>
                          <p className="text-xs text-muted-foreground">Vehicle has working AC</p>
                        </div>
                        <Switch checked={hasAc} onCheckedChange={setHasAc} />
                      </div>
                    </>
                  )}

                  {role === 'guide' && (
                    <>
                      <div>
                        <Label htmlFor="specialties">Specialties</Label>
                        <Input id="specialties" value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="Trekking, Wildlife, Heritage Tours, Tea Estates" required />
                        <p className="text-xs text-muted-foreground mt-1">Comma-separated list of what you specialize in</p>
                      </div>
                      <div>
                        <Label htmlFor="languages">Languages You Speak</Label>
                        <Input id="languages" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hindi, Tamil" required />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="exp">Years of Experience</Label>
                          <Input id="exp" type="number" min="0" max="60" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="5" required />
                        </div>
                        <div>
                          <Label htmlFor="ppd-g">Price per Day (₹)</Label>
                          <Input id="ppd-g" type="number" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} placeholder="2000" required />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">About You</Label>
                        <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell travelers about yourself, your favorite hidden trails, and what makes a tour with you special." required />
                      </div>
                    </>
                  )}

                  {role === 'shop_owner' && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="sname">Shop Name</Label>
                          <Input id="sname" value={name} onChange={e => setName(e.target.value)} placeholder="Hilltop Crafts" required />
                        </div>
                        <div>
                          <Label>Shop Type</Label>
                          <select
                            value={shopType}
                            onChange={e => setShopType(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                          >
                            {['Crafts', 'Café / Restaurant', 'Tea & Spices', 'Equipment Rental', 'Souvenirs', 'Bakery', 'Pharmacy', 'Grocery'].map(v => <option key={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Ooty" required />
                      </div>
                      <div>
                        <Label htmlFor="hours">Hours</Label>
                        <Input id="hours" value={hours} onChange={e => setHours(e.target.value)} placeholder="10am – 7pm, closed Tuesdays" />
                      </div>
                      <div>
                        <Label htmlFor="desc">Description</Label>
                        <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What you sell, what makes you special, anything travelers should know." />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 bg-forest-700 hover:bg-forest-800 text-white" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Save {meta.itemSingular}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Items list */}
          {items.length === 0 && !showForm ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center text-forest-700 dark:text-forest-400">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">{meta.emptyTitle}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">{meta.emptyDesc}</p>
                <Button className="bg-forest-700 hover:bg-forest-800 text-white" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-1" />Get started
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map(item => <ItemCard key={item.id} role={role} item={item} />)}
            </div>
          )}
        </div>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-golden-500" />
              Quick tips for {meta.label}s
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-forest-400 mt-0.5 shrink-0" /> Travelers can call or WhatsApp you directly — keep your phone number current in your profile.</div>
            <div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-forest-400 mt-0.5 shrink-0" /> Listings with photos and detailed descriptions get 3× more bookings.</div>
            <div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-forest-400 mt-0.5 shrink-0" /> Verified KYC owners are surfaced higher in search results.</div>
            <div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest-600 dark:text-forest-400 mt-0.5 shrink-0" /> Reply quickly to travelers — high response rate boosts your visibility.</div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function ItemCard({ role, item }: { role: Role; item: Item }) {
  if (role === 'cab_owner') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="font-semibold">{item.vehicle_type}</div>
              <div className="text-xs text-muted-foreground font-mono">{item.vehicle_name}</div>
            </div>
            <Badge className="bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-400 border-forest-200 dark:border-forest-900 text-xs">
              {item.seats} seats {item.ac ? '· AC' : ''}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Per km</div>
              <div className="font-semibold">₹{item.price_per_km}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Per day</div>
              <div className="font-semibold">₹{item.price_per_day}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (role === 'guide') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">{item.name || 'Guide profile'}</div>
            {item.verified && (
              <Badge className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900 text-xs">
                Verified
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mb-1">
            <strong>Languages:</strong> {(item.languages ?? []).join(', ')}
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            <strong>Specialties:</strong> {(item.specialties ?? []).join(', ')}
          </div>
          <div className="text-sm font-semibold mt-2">₹{item.price_per_day} / day</div>
          {item.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-3 whitespace-pre-line">{item.bio}</p>}
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="font-semibold">{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.type} · {item.city}</div>
          </div>
        </div>
        {item.timings && <div className="text-xs text-muted-foreground mt-1">{item.timings}</div>}
        {item.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{item.description}</p>}
      </CardContent>
    </Card>
  )
}
