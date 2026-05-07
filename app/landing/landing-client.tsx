'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  MapPin, Star, Shield, Phone, CheckCircle, ArrowRight, Search,
  Mountain, Compass, ChevronRight, Heart, IndianRupee, LogIn, User
} from 'lucide-react'
import type { Destination } from '@/types/database'

interface Props {
  settings: Record<string, string>
  destinations: Destination[]
}

const DEFAULT_DESTINATIONS = [
  { id: '1', name: 'The Nilgiris', state: 'Tamil Nadu', cover_image: 'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&q=80', property_count: 120 },
  { id: '2', name: 'Ooty', state: 'Tamil Nadu', cover_image: 'https://images.unsplash.com/photo-1591465001572-a2a72f4f4093?w=800&q=80', property_count: 85 },
  { id: '3', name: 'Kodaikanal', state: 'Tamil Nadu', cover_image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80', property_count: 60 },
  { id: '4', name: 'Munnar', state: 'Kerala', cover_image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80', property_count: 95 },
  { id: '5', name: 'Coorg', state: 'Karnataka', cover_image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80', property_count: 70 },
]

const DEFAULT_TESTIMONIALS = [
  { name: 'Priya R.', location: 'Bangalore', text: 'Found a stunning cottage in Coonoor for half the price of Booking.com. The owner picked us up from the station!', avatar: 'P' },
  { name: 'Arjun M.', location: 'Mumbai', text: 'No commission means the host could afford to give us a proper home-cooked breakfast every morning. Loved it.', avatar: 'A' },
  { name: 'Sneha K.', location: 'Chennai', text: 'Talking directly to our guide before the trip made all the difference. He customized everything for our family.', avatar: 'S' },
]

function s(settings: Record<string, string>, key: string, fallback = '') {
  return settings[key] ?? fallback
}
function isOn(settings: Record<string, string>, key: string, def = true) {
  const v = settings[key]
  if (v === undefined) return def
  return v === 'true' || v === '1'
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const dur = 1500
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dur)
      setCount(Math.floor(t * value))
      if (t === 1) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [inView, value])
  return <span ref={ref}>{count}{suffix}</span>
}

export default function LandingClient({ settings, destinations }: Props) {
  const { user } = useSupabase()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [destination, setDestination] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const showStats = isOn(settings, 'landing_stats_show')
  const showHow = isOn(settings, 'landing_how_show')
  const showDestinations = isOn(settings, 'landing_destinations_show')
  const showWhy = isOn(settings, 'landing_why_show')
  const showTestimonials = isOn(settings, 'landing_testimonials_show')
  const showFinalCta = isOn(settings, 'landing_finalcta_show')
  const showVendorStrip = isOn(settings, 'landing_vendor_strip_show')

  const appName = s(settings, 'brand_app_name', 'GoMiGooo!')
  const heroBg = s(settings, 'landing_hero_bg_image', 'https://images.unsplash.com/photo-1599661046827-9a64bd68a8da?w=2400&q=80')
  const heroHeadline = s(settings, 'landing_hero_headline', 'Discover India.\nDirectly.')
  const heroSub = s(settings, 'landing_hero_subheadline', 'Book authentic stays, local guides & cabs across India.')
  const heroKicker = s(settings, 'landing_hero_kicker', 'Zero commission · 100% authentic')
  const ctaPrimary = s(settings, 'landing_hero_cta_primary', 'Explore Stays')
  const ctaPrimaryLink = s(settings, 'landing_hero_cta_primary_link', '/explore')
  const ctaSecondary = s(settings, 'landing_hero_cta_secondary', 'Plan My Trip')
  const ctaSecondaryLink = s(settings, 'landing_hero_cta_secondary_link', '/explore?tripPlanner=1')
  const showSearch = isOn(settings, 'landing_hero_show_search')

  const destItems = destinations.length > 0 ? destinations : DEFAULT_DESTINATIONS

  let testimonials = DEFAULT_TESTIMONIALS
  try {
    const t = JSON.parse(s(settings, 'testimonials_json', '[]'))
    if (Array.isArray(t) && t.length > 0) testimonials = t
  } catch { /* keep defaults */ }

  let exploreLinks: { label: string; href: string }[] = []
  let companyLinks: { label: string; href: string }[] = []
  let legalLinks: { label: string; href: string }[] = []
  try { exploreLinks = JSON.parse(s(settings, 'landing_footer_explore_links', '[]')) } catch {}
  try { companyLinks = JSON.parse(s(settings, 'landing_footer_company_links', '[]')) } catch {}
  try { legalLinks = JSON.parse(s(settings, 'landing_footer_legal_links', '[]')) } catch {}

  function search(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (destination) params.set('search', destination)
    router.push(`/explore${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="min-h-screen bg-warmwhite text-foreground">
      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all ${scrolled ? 'glass shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className={`font-serif text-2xl font-bold transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>
            {appName}
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/explore"
              className={`hidden sm:inline-block text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                scrolled ? 'hover:bg-muted text-foreground' : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Explore
            </Link>
            <ThemeToggle className={scrolled ? '' : 'text-white/90 hover:text-white hover:bg-white/10'} />
            {user ? (
              <Button asChild className="bg-forest-700 hover:bg-forest-800 text-white rounded-full px-4">
                <Link href="/customer/dashboard"><User className="w-4 h-4 mr-1.5" />Account</Link>
              </Button>
            ) : (
              <Button asChild className="bg-forest-700 hover:bg-forest-800 text-white rounded-full px-4">
                <Link href="/auth"><LogIn className="w-4 h-4 mr-1.5" />Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src={heroBg} alt="Hero" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
          {heroKicker && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-medium"
            >
              <span className="w-2 h-2 bg-golden-400 rounded-full animate-pulse" />
              {heroKicker}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 whitespace-pre-line text-balance"
          >
            {heroHeadline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-8 text-balance"
          >
            {heroSub}
          </motion.p>

          {/* SEARCH BAR */}
          {showSearch && (
            <motion.form
              onSubmit={search}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="max-w-xl mx-auto mb-6"
            >
              <div className="flex gap-2 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Where do you want to go? Ooty, Coorg, Munnar..."
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground bg-transparent h-11"
                  />
                </div>
                <Button type="submit" className="bg-forest-700 hover:bg-forest-800 text-white rounded-xl px-6 h-11">
                  Search
                </Button>
              </div>
            </motion.form>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Button asChild size="lg" className="bg-golden-500 hover:bg-golden-600 text-foreground rounded-full px-6 shadow-xl">
              <Link href={ctaPrimaryLink}><Compass className="w-5 h-5 mr-2" />{ctaPrimary}</Link>
            </Button>
            {ctaSecondary && (
              <Button asChild variant="outline" size="lg" className="border-white/40 bg-white/10 text-white hover:bg-white/20 rounded-full px-6 backdrop-blur-sm">
                <Link href={ctaSecondaryLink}>{ctaSecondary}<ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            )}
          </motion.div>

          {/* STATS */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mt-14 pt-8 border-t border-white/15"
            >
              {[
                { v: parseInt(s(settings, 'landing_stat1_value', '500')), suf: s(settings, 'landing_stat1_suffix', '+'), lbl: s(settings, 'landing_stat1_label', 'Stays') },
                { v: parseInt(s(settings, 'landing_stat2_value', '50')), suf: s(settings, 'landing_stat2_suffix', '+'), lbl: s(settings, 'landing_stat2_label', 'Guides') },
                { v: parseInt(s(settings, 'landing_stat3_value', '5')), suf: s(settings, 'landing_stat3_suffix', ''), lbl: s(settings, 'landing_stat3_label', 'Cities') },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-golden-400">
                    <AnimatedCounter value={stat.v} suffix={stat.suf} />
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 mt-1">{stat.lbl}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs flex flex-col items-center gap-1 animate-bounce">
          <span>Scroll</span>
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      {showHow && (
        <section className="py-20 px-4 bg-surface">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-serif text-3xl md:text-5xl font-bold mb-3 text-balance">{s(settings, 'landing_how_title', 'How GoMiGooo! works')}</h2>
              <p className="text-muted-foreground text-balance">{s(settings, 'landing_how_subtitle', 'Three simple steps to your next adventure')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Search, t: s(settings, 'landing_how_step1_title', 'Discover'), d: s(settings, 'landing_how_step1_desc', '') },
                { icon: Phone, t: s(settings, 'landing_how_step2_title', 'Connect'), d: s(settings, 'landing_how_step2_desc', '') },
                { icon: Mountain, t: s(settings, 'landing_how_step3_title', 'Experience'), d: s(settings, 'landing_how_step3_desc', '') },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-card border border-border card-hover"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center text-forest-700 dark:text-forest-400">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-bold text-golden-600 mb-1">STEP {i + 1}</div>
                  <h3 className="font-serif text-xl font-semibold mb-2">{step.t}</h3>
                  <p className="text-sm text-muted-foreground">{step.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DESTINATIONS */}
      {showDestinations && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-serif text-3xl md:text-5xl font-bold mb-3 text-balance">{s(settings, 'landing_destinations_title', 'Explore Top Destinations')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-balance">{s(settings, 'landing_destinations_subtitle', '')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {destItems.slice(0, 6).map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Link
                    href={`/explore?city=${encodeURIComponent(d.name)}`}
                    className="group block relative h-64 sm:h-72 rounded-3xl overflow-hidden card-hover"
                  >
                    {d.cover_image ? (
                      <Image src={d.cover_image} alt={d.name} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full gradient-hero" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <h3 className="font-serif text-2xl font-bold mb-1">{d.name}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 opacity-90"><MapPin className="w-3.5 h-3.5" />{d.state}</span>
                        {d.property_count > 0 && (
                          <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium">{d.property_count} stays</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY GOMIGOOO */}
      {showWhy && (
        <section className="py-20 px-4 bg-surface">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-serif text-3xl md:text-5xl font-bold mb-3 text-balance">{s(settings, 'landing_why_title', 'Why travelers love GoMiGooo!')}</h2>
              <p className="text-muted-foreground text-balance">{s(settings, 'landing_why_subtitle', '')}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: IndianRupee, t: s(settings, 'landing_why_point1_title', ''), d: s(settings, 'landing_why_point1_desc', '') },
                { icon: Phone, t: s(settings, 'landing_why_point2_title', ''), d: s(settings, 'landing_why_point2_desc', '') },
                { icon: Shield, t: s(settings, 'landing_why_point3_title', ''), d: s(settings, 'landing_why_point3_desc', '') },
                { icon: CheckCircle, t: s(settings, 'landing_why_point4_title', ''), d: s(settings, 'landing_why_point4_desc', '') },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex gap-4 p-6 rounded-2xl bg-card border border-border card-hover"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-forest-50 dark:bg-forest-950 flex items-center justify-center text-forest-700 dark:text-forest-400">
                    <p.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold mb-1">{p.t}</h3>
                    <p className="text-sm text-muted-foreground">{p.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {showTestimonials && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-balance">{s(settings, 'landing_testimonials_title', 'Travelers love what they find')}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.slice(0, 6).map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="p-6 rounded-2xl bg-card border border-border"
                >
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-golden-400 text-golden-400" />)}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-forest-700 text-white flex items-center justify-center text-sm font-bold">{t.avatar}</div>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.location}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      {showFinalCta && (
        <section className="py-24 px-4 gradient-hero text-white">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-golden-400" />
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-balance">{s(settings, 'landing_finalcta_title', 'Ready to explore?')}</h2>
            <p className="text-lg text-white/85 mb-8 max-w-xl mx-auto text-balance">{s(settings, 'landing_finalcta_subtitle', '')}</p>
            <Button asChild size="lg" className="bg-golden-500 hover:bg-golden-600 text-foreground rounded-full px-8 shadow-2xl">
              <Link href={s(settings, 'landing_finalcta_button_link', '/explore')}>
                <Compass className="w-5 h-5 mr-2" />{s(settings, 'landing_finalcta_button', 'Start Exploring')}
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* VENDOR INVITE STRIP — subtle, not pushy */}
      {showVendorStrip && (
        <section className="py-6 px-4 bg-card border-y border-border">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <span className="text-sm text-muted-foreground">{s(settings, 'landing_vendor_strip_text', '')}</span>
            <Link
              href={s(settings, 'landing_vendor_strip_link', '/become-vendor')}
              className="text-sm font-semibold text-forest-700 dark:text-forest-400 hover:underline inline-flex items-center gap-1"
            >
              {s(settings, 'landing_vendor_strip_cta', 'Join as a Vendor')}
            </Link>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-surface border-t border-border py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-serif text-2xl font-bold text-forest-700 dark:text-forest-400 mb-3">{appName}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s(settings, 'landing_footer_about', '')}</p>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-sm">Explore</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {exploreLinks.map((l, i) => (
                  <li key={i}><Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {companyLinks.map((l, i) => (
                  <li key={i}><Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {legalLinks.map((l, i) => (
                  <li key={i}><Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-xs text-muted-foreground text-center">
            {s(settings, 'landing_footer_copyright', '')}
          </div>
        </div>
      </footer>
    </div>
  )
}
