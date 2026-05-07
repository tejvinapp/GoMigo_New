'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MapPin, Star, Users, Zap, Shield, TrendingUp,
  Phone, Map, CheckCircle, ArrowRight, Search,
  Mountain, Car, Compass, ShoppingBag, Share2, ChevronRight
} from 'lucide-react'
import type { Destination } from '@/types/database'

interface Props {
  settings: Record<string, string>
  destinations: Destination[]
}

// Default destinations if DB not seeded yet
const DEFAULT_DESTINATIONS: Partial<Destination>[] = [
  { id: '1', name: 'The Nilgiris', state: 'Tamil Nadu', lat: 11.41, lng: 76.69, property_count: 120, cover_image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80' },
  { id: '2', name: 'Ooty', state: 'Tamil Nadu', lat: 11.41, lng: 76.69, property_count: 85, cover_image: 'https://images.unsplash.com/photo-1582627838-2e66941f87c4?w=600&q=80' },
  { id: '3', name: 'Kodaikanal', state: 'Tamil Nadu', lat: 10.24, lng: 77.49, property_count: 64, cover_image: 'https://images.unsplash.com/photo-1587922546307-776227941871?w=600&q=80' },
  { id: '4', name: 'Munnar', state: 'Kerala', lat: 10.09, lng: 77.06, property_count: 110, cover_image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80' },
  { id: '5', name: 'Coorg', state: 'Karnataka', lat: 12.34, lng: 75.81, property_count: 78, cover_image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80' },
]

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1500
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start = Math.min(start + step, target)
      setCount(Math.floor(start))
      if (start >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶', pool: '🏊', parking: '🅿️', kitchen: '🍳',
  ac: '❄️', gym: '💪', spa: '🛁', pets: '🐾',
}

export default function LandingClient({ settings, destinations: rawDestinations }: Props) {
  const { user } = useSupabase()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const heroHeadline = settings.hero_headline || 'Discover India. Directly.'
  const heroSub = settings.hero_subheadline || 'Book authentic stays, local guides & cabs — zero commission, pure experience'
  const heroBg = settings.hero_bg_url || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1920&q=80'
  const statsProperties = parseInt(settings.stats_properties || '500')
  const statsGuides = parseInt(settings.stats_guides || '200')
  const statsDestinations = parseInt(settings.stats_destinations || '50')

  const destinations = rawDestinations.length > 0 ? rawDestinations : DEFAULT_DESTINATIONS as Destination[]

  let testimonials = []
  try {
    testimonials = JSON.parse(settings.testimonials_json || '[]')
  } catch {}
  if (testimonials.length === 0) {
    testimonials = [
      { name: 'Priya Sharma', location: 'Chennai', rating: 5, text: 'Found an amazing cottage in Coonoor! The owner was so responsive. No booking fees!', avatar: 'PS' },
      { name: 'Rahul Nair', location: 'Bangalore', rating: 5, text: 'Zero-commission means owners actually care — personalized service we never got from big booking sites.', avatar: 'RN' },
      { name: 'Meera K', location: 'Hyderabad', rating: 5, text: 'Our guide Suresh knew every hidden trail in the Nilgiris. Saved 20% vs other platforms!', avatar: 'MK' },
    ]
  }

  const starterPrice = settings.plan_starter_price || '299'
  const proPrice = settings.plan_pro_price || '599'
  const premiumPrice = settings.plan_premium_price || '999'

  function handleExplore() {
    if (user) router.push('/explore')
    else router.push('/auth')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/explore${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`)
  }

  return (
    <div className="overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/landing" className="font-serif text-2xl font-bold text-forest-700">
            GoMiGooo!
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/explore" className="text-muted-foreground hover:text-forest-700 transition-colors">Explore</Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-forest-700 transition-colors">How it Works</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-forest-700 transition-colors">For Owners</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" className="bg-forest-700 hover:bg-forest-800 text-white">
                <Link href="/explore">Explore Now</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button size="sm" className="bg-forest-700 hover:bg-forest-800 text-white" asChild>
                  <Link href="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src={heroBg}
            alt="Indian hill station"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto pt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-golden-400/20 text-golden-200 border-golden-400/30 backdrop-blur-sm">
              🌿 Zero Commission · Pure Experience
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
              {heroHeadline}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              {heroSub}
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <form onSubmit={handleSearch} className="glass rounded-2xl p-2 flex gap-2 max-w-2xl mx-auto mb-8">
              <div className="flex items-center gap-2 flex-1 px-4">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Where in India? (Ooty, Nilgiris, Coorg...)"
                  className="border-0 bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground text-base"
                />
              </div>
              <Button type="submit" className="bg-forest-700 hover:bg-forest-800 text-white rounded-xl h-12 px-6 shrink-0">
                Search
              </Button>
            </form>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleExplore}
                size="lg"
                className="bg-forest-700 hover:bg-forest-800 text-white rounded-xl h-13 px-8 text-base font-medium"
              >
                <Compass className="w-5 h-5 mr-2" />
                Explore as Traveler
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl h-13 px-8 text-base font-medium backdrop-blur-sm"
              >
                <Link href="/auth">
                  <Mountain className="w-5 h-5 mr-2" />
                  List Your Business
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {[
              { label: 'Properties', value: statsProperties, suffix: '+' },
              { label: 'Guides', value: statsGuides, suffix: '+' },
              { label: 'Destinations', value: statsDestinations, suffix: '+' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/60 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 bg-warmwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-forest-50 text-forest-700 border-forest-200">Simple. Direct. Free.</Badge>
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">How GoMiGooo! Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">No middlemen. No hidden fees. Just direct connections between travelers and local businesses.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Compass className="w-8 h-8" />,
                title: 'For Travelers',
                color: 'forest',
                steps: [
                  { icon: <Search className="w-4 h-4" />, text: 'Search by destination, dates & type' },
                  { icon: <MapPin className="w-4 h-4" />, text: 'Explore listings on an interactive map' },
                  { icon: <Phone className="w-4 h-4" />, text: 'Call owner directly OR book online' },
                  { icon: <CheckCircle className="w-4 h-4" />, text: 'Pay 20% advance, rest on arrival' },
                ],
              },
              {
                icon: <Mountain className="w-8 h-8" />,
                title: 'For Property Owners',
                color: 'golden',
                steps: [
                  { icon: <CheckCircle className="w-4 h-4" />, text: 'Subscribe (₹299–999/month only)' },
                  { icon: <Map className="w-4 h-4" />, text: 'List your property with photos & map' },
                  { icon: <Users className="w-4 h-4" />, text: 'Get direct booking requests' },
                  { icon: <TrendingUp className="w-4 h-4" />, text: 'Earn 100% — zero commission, ever' },
                ],
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'GoMiGooo! Promise',
                color: 'forest',
                steps: [
                  { icon: <Zap className="w-4 h-4" />, text: 'Verified property photos only' },
                  { icon: <Star className="w-4 h-4" />, text: 'Reviews from real verified guests' },
                  { icon: <Shield className="w-4 h-4" />, text: 'Secure advance payment via Razorpay' },
                  { icon: <CheckCircle className="w-4 h-4" />, text: '₹0 commission — always' },
                ],
              },
            ].map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`rounded-2xl p-8 border ${
                  col.color === 'golden'
                    ? 'bg-golden-50 border-golden-200'
                    : 'bg-forest-50 border-forest-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                  col.color === 'golden' ? 'bg-golden-400 text-white' : 'bg-forest-700 text-white'
                }`}>
                  {col.icon}
                </div>
                <h3 className="text-xl font-serif font-semibold mb-4 text-foreground">{col.title}</h3>
                <ul className="space-y-3">
                  {col.steps.map((step, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className={`shrink-0 ${col.color === 'golden' ? 'text-golden-600' : 'text-forest-700'}`}>
                        {step.icon}
                      </span>
                      {step.text}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DESTINATIONS ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-forest-50 text-forest-700 border-forest-200">🗺️ Start Exploring</Badge>
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Top Destinations</h2>
            <p className="text-muted-foreground">Handpicked hill stations and nature escapes across South India</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.slice(0, 6).map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/explore?destination=${encodeURIComponent(dest.name)}`}
                  className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 card-hover"
                >
                  <div className="relative h-52">
                    {dest.cover_image ? (
                      <Image
                        src={dest.cover_image}
                        alt={dest.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full gradient-hero" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-serif font-bold">{dest.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-white/80 mt-1">
                        <MapPin className="w-3 h-3" />
                        {dest.state}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-black/30 text-white border-transparent backdrop-blur-sm text-xs">
                        {dest.property_count || 0}+ stays
                      </Badge>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="rounded-xl border-forest-700 text-forest-700 hover:bg-forest-50">
              <Link href="/explore">
                View all destinations <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── OWNER VALUE PROP + PRICING ─── */}
      <section id="pricing" className="py-24 bg-warmwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <Badge className="mb-4 bg-golden-50 text-golden-700 border-golden-200">🏆 For Business Owners</Badge>
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Keep 100% of Your Earnings</h2>
          </motion.div>

          {/* Comparison */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-16">
            <div className="flex-1 rounded-xl bg-red-50 border border-red-100 p-5 text-center">
              <div className="text-lg font-bold text-red-700 mb-1">Booking.com / OYO</div>
              <div className="text-3xl font-bold text-red-600">15–25%</div>
              <div className="text-sm text-red-500 mt-1">commission on every booking</div>
            </div>
            <div className="flex items-center justify-center text-2xl font-bold text-muted-foreground">VS</div>
            <div className="flex-1 rounded-xl bg-forest-50 border border-forest-200 p-5 text-center">
              <div className="text-lg font-bold text-forest-700 mb-1">GoMiGooo!</div>
              <div className="text-3xl font-bold text-forest-700">₹0</div>
              <div className="text-sm text-forest-600 mt-1">commission — only flat subscription</div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter', price: starterPrice, popular: false,
                features: ['1 listing', 'Up to 10 photos', 'Basic booking management', 'Direct customer calls', 'Verified listing badge'],
              },
              {
                name: 'Pro', price: proPrice, popular: true,
                features: ['Up to 3 listings', 'Up to 30 photos', 'Booking calendar', 'Revenue tracker', 'Priority in search', 'Analytics dashboard'],
              },
              {
                name: 'Premium', price: premiumPrice, popular: false,
                features: ['Unlimited listings', 'Unlimited photos', 'AI listing descriptions', 'Full analytics', 'Top placement', 'Dedicated support'],
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 border relative ${
                  plan.popular
                    ? 'bg-forest-700 text-white border-forest-600 shadow-xl scale-105'
                    : 'bg-white border-border shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-golden-400 text-white border-transparent px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                <div className={`text-lg font-semibold mb-2 ${plan.popular ? 'text-white' : 'text-foreground'}`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-bold font-serif ${plan.popular ? 'text-white' : 'text-forest-700'}`}>
                    ₹{parseInt(plan.price).toLocaleString('en-IN')}
                  </span>
                  <span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>/month</span>
                </div>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>+ 0% commission</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.popular ? 'text-white/90' : 'text-muted-foreground'}`}>
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-golden-300' : 'text-forest-700'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full rounded-xl ${
                    plan.popular
                      ? 'bg-golden-400 hover:bg-golden-500 text-white'
                      : 'bg-forest-700 hover:bg-forest-800 text-white'
                  }`}
                >
                  <Link href="/auth">Get Started →</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-forest-50 text-forest-700 border-forest-200">⭐ Real Reviews</Badge>
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Loved by Travelers & Owners</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t: { name: string; location: string; rating: number; text: string; avatar: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-warmwhite rounded-2xl p-6 border border-border card-hover"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-golden-400 text-golden-400" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {[
              { icon: <Shield className="w-5 h-5" />, text: 'Verified real photos only' },
              { icon: <CheckCircle className="w-5 h-5" />, text: 'Confirmed stay reviews' },
              { icon: <Zap className="w-5 h-5" />, text: 'Secure Razorpay payments' },
              { icon: <Star className="w-5 h-5" />, text: 'SuperHost verified owners' },
            ].map(badge => (
              <div key={badge.text} className="flex items-center gap-2 text-sm text-forest-700 bg-forest-50 border border-forest-100 rounded-full px-4 py-2">
                {badge.icon}
                {badge.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 gradient-hero text-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-6">
              Ready to Discover India?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Join thousands of travelers experiencing authentic India without the booking fee markup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleExplore}
                size="lg"
                className="bg-golden-400 hover:bg-golden-500 text-white rounded-xl h-13 px-8 text-base"
              >
                Start Exploring Free
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-white border-white/40 hover:bg-white/10 rounded-xl h-13 px-8 text-base"
              >
                <Link href="/auth">List Your Business</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-forest-900 text-white/70 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-serif text-2xl font-bold text-white mb-3">GoMiGooo!</h3>
              <p className="text-sm leading-relaxed mb-4">
                India&apos;s first zero-commission tourism marketplace. Connecting travelers with authentic local experiences.
              </p>
              <div className="flex gap-3">
                {[Share2, Share2, Share2].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Explore</h4>
              <ul className="space-y-2 text-sm">
                {['Destinations', 'Hotels & Cottages', 'Tour Guides', 'Cab Services', 'Local Shops'].map(link => (
                  <li key={link}><Link href="/explore" className="hover:text-white transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">For Owners</h4>
              <ul className="space-y-2 text-sm">
                {['List Your Property', 'Pricing Plans', 'Owner Dashboard', 'How Payouts Work', 'Become a Guide'].map(link => (
                  <li key={link}><Link href="/auth" className="hover:text-white transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service', 'Refund Policy'].map(link => (
                  <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
              <div className="mt-4">
                <p className="text-xs mb-2">App coming soon</p>
                <div className="flex gap-2">
                  <div className="text-xs bg-white/10 rounded-lg px-3 py-2">App Store</div>
                  <div className="text-xs bg-white/10 rounded-lg px-3 py-2">Google Play</div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
            <p>© {new Date().getFullYear()} GoMiGooo! All rights reserved. Starting with The Nilgiris.</p>
            <p>Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
