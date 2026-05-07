'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CreditCard, Mail, Bot, Layout, Package, Zap, Eye, EyeOff, Save,
  Palette, Search, BarChart, Calendar, Lock, Bell, Languages, RefreshCw,
  Scale, Phone, Wrench, MessageSquare, Settings as SettingsIcon,
  Sparkles, ListChecks, MapPin, Heart, Star, ArrowRight, Footprints, Users2,
  FileText, X, RotateCcw, Loader2, CheckCircle2
} from 'lucide-react'
import type { PlatformSetting } from '@/types/database'

interface Props {
  initialSettings: PlatformSetting[]
}

type CategoryMeta = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  helpUrl?: { label: string; href: string }
  group: 'core' | 'landing' | 'site' | 'business' | 'system'
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  // CORE INTEGRATIONS
  payments:     { group: 'core', label: 'Payments', icon: CreditCard, description: 'Razorpay credentials for cards, UPI, and subscriptions.', helpUrl: { label: 'dashboard.razorpay.com', href: 'https://dashboard.razorpay.com' } },
  email:        { group: 'core', label: 'Email', icon: Mail, description: 'Resend API for booking confirmations and notifications.', helpUrl: { label: 'resend.com', href: 'https://resend.com' } },
  ai:           { group: 'core', label: 'AI', icon: Bot, description: 'Anthropic Claude API for AI listing descriptions and trip planner.', helpUrl: { label: 'console.anthropic.com', href: 'https://console.anthropic.com/settings/keys' } },
  sms:          { group: 'core', label: 'SMS', icon: MessageSquare, description: 'SMS provider settings (Twilio, MSG91, etc.).' },
  analytics:    { group: 'core', label: 'Analytics', icon: BarChart, description: 'Tracking IDs for Google Analytics, Facebook Pixel, etc.' },

  // LANDING PAGE SECTIONS
  'landing-hero':         { group: 'landing', label: 'Hero', icon: Sparkles, description: 'Top-of-page hero: headline, subheadline, background, CTA buttons, search bar.' },
  'landing-stats':        { group: 'landing', label: 'Stats Bar', icon: BarChart, description: 'Animated stat counters (e.g. "500+ stays").' },
  'landing-how':          { group: 'landing', label: 'How It Works', icon: ListChecks, description: '3-step explainer below the hero.' },
  'landing-destinations': { group: 'landing', label: 'Destinations', icon: MapPin, description: 'Featured destinations carousel section.' },
  'landing-why':          { group: 'landing', label: 'Why Us', icon: Heart, description: 'Value proposition for travelers (4 points).' },
  'landing-testimonials': { group: 'landing', label: 'Testimonials', icon: Star, description: 'Reviews section.' },
  'landing-finalcta':     { group: 'landing', label: 'Final CTA', icon: ArrowRight, description: 'Closing call-to-action before the footer.' },
  'landing-footer':       { group: 'landing', label: 'Footer', icon: Footprints, description: 'Footer copy, link columns (JSON), copyright.' },
  'landing-vendor-strip': { group: 'landing', label: 'Vendor Invite Strip', icon: Users2, description: 'Subtle bottom banner inviting people to become vendors.' },

  // SITE-WIDE
  branding:     { group: 'site', label: 'Branding', icon: Palette, description: 'Logo, colors, app name, and tagline.' },
  seo:          { group: 'site', label: 'SEO', icon: Search, description: 'Meta tags and search engine visibility.' },
  content:      { group: 'site', label: 'Content', icon: Layout, description: 'Hero copy, stats, testimonials, and other site copy.' },
  contact:      { group: 'site', label: 'Contact & Social', icon: Phone, description: 'Support email/phone and social media links.' },
  'static-pages': { group: 'site', label: 'Static Pages', icon: FileText, description: 'About, Contact, Terms, Privacy, Cookies, Refund, Press.' },

  // BUSINESS RULES
  pricing:      { group: 'business', label: 'Subscription Pricing', icon: Package, description: 'Owner subscription plan amounts and feature lists.' },
  booking:      { group: 'business', label: 'Booking Rules', icon: Calendar, description: 'Advance %, min/max nights, cancellation policy.' },
  subscription: { group: 'business', label: 'Subscription Rules', icon: RefreshCw, description: 'Trial days, grace periods, auto-cancel rules.' },
  limits:       { group: 'business', label: 'Limits & Quotas', icon: Lock, description: 'Quotas for listings, photos, KYC requirements.' },
  notifications:{ group: 'business', label: 'Notifications', icon: Bell, description: 'Email triggers for various platform events.' },

  // SYSTEM
  features:     { group: 'system', label: 'Feature Flags', icon: Zap, description: 'Master feature flags — toggle features on/off.' },
  localization: { group: 'system', label: 'Localization', icon: Languages, description: 'Default language, currency, timezone.' },
  legal:        { group: 'system', label: 'Legal & Company', icon: Scale, description: 'Terms, privacy URLs, GSTIN, and company info.' },
  operations:   { group: 'system', label: 'Operations', icon: Wrench, description: 'Maintenance mode, signup toggles, system controls.' },
}

const GROUP_LABELS: Record<string, string> = {
  core: 'Integrations',
  landing: 'Landing Page',
  site: 'Site-wide',
  business: 'Business Rules',
  system: 'System',
}

export default function AdminSettingsClient({ initialSettings }: Props) {
  const { supabase } = useSupabase()

  // Stable initial values map for "reset" support
  const initialValuesRef = useRef<Record<string, string>>(
    Object.fromEntries(initialSettings.map(s => [s.key, s.value ?? '']))
  )

  const [values, setValues] = useState<Record<string, string>>(initialValuesRef.current)
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [recentlySaved, setRecentlySaved] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const known = Object.keys(CATEGORY_META)
    const seen = Array.from(new Set(initialSettings.map(s => s.category)))
    return seen.find(c => known.includes(c)) ?? seen[0] ?? 'payments'
  })
  const [globalSearch, setGlobalSearch] = useState('')

  const sensitiveKeys = useMemo(
    () => new Set(initialSettings.filter(s => s.sensitive).map(s => s.key)),
    [initialSettings]
  )

  // Build category list ordered by group
  const orderedCategories = useMemo(() => {
    const seen = Array.from(new Set(initialSettings.map(s => s.category)))
    const known = seen.filter(c => CATEGORY_META[c])
    const unknown = seen.filter(c => !CATEGORY_META[c])
    const groupOrder = ['core', 'landing', 'site', 'business', 'system']
    known.sort((a, b) => {
      const ga = groupOrder.indexOf(CATEGORY_META[a].group)
      const gb = groupOrder.indexOf(CATEGORY_META[b].group)
      if (ga !== gb) return ga - gb
      return CATEGORY_META[a].label.localeCompare(CATEGORY_META[b].label)
    })
    return [...known, ...unknown]
  }, [initialSettings])

  const settingsByCategory = useMemo(() => {
    const map: Record<string, PlatformSetting[]> = {}
    for (const s of initialSettings) {
      if (!map[s.category]) map[s.category] = []
      map[s.category].push(s)
    }
    return map
  }, [initialSettings])

  // Search results (across all categories)
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase()
    if (!q) return null
    return initialSettings.filter(s =>
      s.key.toLowerCase().includes(q) ||
      s.label.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    )
  }, [initialSettings, globalSearch])

  const handleChange = useCallback((key: string, value: string) => {
    setValues(prev => {
      if (prev[key] === value) return prev
      return { ...prev, [key]: value }
    })
    setPending(prev => {
      const orig = initialValuesRef.current[key] ?? ''
      const isDirty = value !== orig
      const next = new Set(prev)
      if (isDirty) next.add(key)
      else next.delete(key)
      return next
    })
    setRecentlySaved(prev => {
      if (!prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const reset = useCallback((key: string) => {
    handleChange(key, initialValuesRef.current[key] ?? '')
  }, [handleChange])

  const persist = useCallback(async (keysToSave: string[]) => {
    let saved = 0
    let failed = 0
    for (const key of keysToSave) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('platform_settings') as any)
        .update({ value: values[key] })
        .eq('key', key)
      if (error) { failed++; continue }
      saved++
      initialValuesRef.current[key] = values[key]
    }
    setPending(prev => {
      const next = new Set(prev)
      keysToSave.forEach(k => next.delete(k))
      return next
    })
    setRecentlySaved(prev => {
      const next = new Set(prev)
      keysToSave.forEach(k => next.add(k))
      return next
    })
    setTimeout(() => setRecentlySaved(new Set()), 2500)
    return { saved, failed }
  }, [supabase, values])

  const saveOne = useCallback(async (key: string) => {
    setSaving(key)
    const { saved, failed } = await persist([key])
    setSaving(null)
    if (failed) toast.error(`Failed to save ${key}`)
    else if (saved) toast.success('Saved')
  }, [persist])

  const saveAll = useCallback(async () => {
    if (pending.size === 0) return
    setSavingAll(true)
    const keys = Array.from(pending)
    const { saved, failed } = await persist(keys)
    setSavingAll(false)
    if (failed && saved) toast.warning(`Saved ${saved}, failed ${failed}`)
    else if (failed) toast.error(`Failed to save ${failed} setting${failed === 1 ? '' : 's'}`)
    else toast.success(`Saved ${saved} setting${saved === 1 ? '' : 's'}`)
  }, [pending, persist])

  // Cmd/Ctrl+S to save all
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (pending.size > 0) saveAll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, saveAll])

  // Test email
  async function sendTestEmail() {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' }),
    })
    if (res.ok) toast.success('Test email sent — check your inbox')
    else toast.error('Failed to send test email — check email settings')
  }

  // Group sidebar entries
  const sidebar = useMemo(() => {
    const groups: Record<string, { category: string; label: string; icon: CategoryMeta['icon']; count: number; pendingCount: number }[]> = {}
    for (const cat of orderedCategories) {
      const meta = CATEGORY_META[cat]
      const group = meta?.group ?? 'system'
      if (!groups[group]) groups[group] = []
      const items = settingsByCategory[cat] ?? []
      const pendingCount = items.filter(s => pending.has(s.key)).length
      groups[group].push({
        category: cat,
        label: meta?.label ?? cat,
        icon: meta?.icon ?? SettingsIcon,
        count: items.length,
        pendingCount,
      })
    }
    return groups
  }, [orderedCategories, settingsByCategory, pending])

  const activeMeta = CATEGORY_META[activeCategory]
  const ActiveIcon = activeMeta?.icon ?? SettingsIcon
  const activeFields = settingsByCategory[activeCategory] ?? []

  return (
    <div className="max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <SettingsIcon className="w-6 h-6 text-forest-700 dark:text-forest-400" />
          <h1 className="text-2xl font-serif font-bold">Platform Settings</h1>
          <Badge className="bg-muted text-muted-foreground border-border">{initialSettings.length} settings · {orderedCategories.length} sections</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure every aspect of your platform from here — no code changes needed.
          Sensitive credentials are encrypted at rest. Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘/Ctrl + S</kbd> to save.
        </p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search all settings (e.g. razorpay, hero, color)..."
            className="pl-9 pr-9"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        {!searchResults && (
          <aside className="md:w-64 shrink-0 md:border-r border-border md:sticky md:top-14 md:self-start md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto">
            <nav className="p-3 space-y-4">
              {Object.entries(sidebar).map(([group, items]) => (
                <div key={group}>
                  <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {GROUP_LABELS[group] ?? group}
                  </div>
                  <ul className="space-y-0.5">
                    {items.map(item => {
                      const Icon = item.icon
                      const active = item.category === activeCategory
                      return (
                        <li key={item.category}>
                          <button
                            onClick={() => setActiveCategory(item.category)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left ${
                              active
                                ? 'bg-forest-700 text-white'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.pendingCount > 0 ? (
                              <Badge className="bg-amber-500 text-white border-0 h-5 min-w-5 text-[10px] px-1.5">
                                {item.pendingCount}
                              </Badge>
                            ) : (
                              <span className={`text-[10px] ${active ? 'text-white/60' : 'text-muted-foreground/50'}`}>
                                {item.count}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
        )}

        {/* Main panel */}
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          {searchResults ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for &ldquo;{globalSearch}&rdquo;
                </h2>
                <Button variant="outline" size="sm" onClick={() => setGlobalSearch('')}>Clear</Button>
              </div>
              {searchResults.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-muted-foreground">No settings match your search.</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(s => (
                    <SettingRow
                      key={s.key}
                      setting={s}
                      value={values[s.key] ?? ''}
                      isPending={pending.has(s.key)}
                      isSaved={recentlySaved.has(s.key)}
                      isSaving={saving === s.key}
                      isSensitive={sensitiveKeys.has(s.key)}
                      showValue={!!showSensitive[s.key]}
                      onChange={v => handleChange(s.key, v)}
                      onToggleVisible={() => setShowSensitive(p => ({ ...p, [s.key]: !p[s.key] }))}
                      onReset={() => reset(s.key)}
                      onSave={() => saveOne(s.key)}
                      showCategory
                      categoryLabel={CATEGORY_META[s.category]?.label ?? s.category}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <ActiveIcon className="w-5 h-5 text-forest-700 dark:text-forest-400" />
                  <h2 className="text-xl font-serif font-bold">{activeMeta?.label ?? activeCategory}</h2>
                  <Badge className="bg-muted text-muted-foreground border-border">{activeFields.length}</Badge>
                </div>
                {activeCategory === 'email' && (
                  <Button variant="outline" size="sm" onClick={sendTestEmail}>
                    <Mail className="w-3.5 h-3.5 mr-1.5" />Send test email
                  </Button>
                )}
              </div>
              {activeMeta?.description && (
                <p className="text-sm text-muted-foreground mb-5">
                  {activeMeta.description}
                  {activeMeta.helpUrl && (
                    <>
                      {' '}Get yours at{' '}
                      <a href={activeMeta.helpUrl.href} target="_blank" rel="noopener noreferrer" className="text-forest-700 dark:text-forest-400 hover:underline">
                        {activeMeta.helpUrl.label}
                      </a>
                    </>
                  )}
                </p>
              )}

              <div className="space-y-2">
                {activeFields.map(s => (
                  <SettingRow
                    key={s.key}
                    setting={s}
                    value={values[s.key] ?? ''}
                    isPending={pending.has(s.key)}
                    isSaved={recentlySaved.has(s.key)}
                    isSaving={saving === s.key}
                    isSensitive={sensitiveKeys.has(s.key)}
                    showValue={!!showSensitive[s.key]}
                    onChange={v => handleChange(s.key, v)}
                    onToggleVisible={() => setShowSensitive(p => ({ ...p, [s.key]: !p[s.key] }))}
                    onReset={() => reset(s.key)}
                    onSave={() => saveOne(s.key)}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sticky bottom save bar */}
      {pending.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-medium">
                {pending.size} unsaved change{pending.size === 1 ? '' : 's'}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">⌘/Ctrl + S to save</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  pending.forEach(key => reset(key))
                  toast.info('Reverted all unsaved changes')
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Discard
              </Button>
              <Button
                size="sm"
                className="bg-forest-700 hover:bg-forest-800 text-white"
                onClick={saveAll}
                disabled={savingAll}
              >
                {savingAll ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save {pending.size} change{pending.size === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingRow({
  setting, value, isPending, isSaved, isSaving, isSensitive, showValue,
  onChange, onToggleVisible, onReset, onSave, showCategory, categoryLabel,
}: {
  setting: PlatformSetting
  value: string
  isPending: boolean
  isSaved: boolean
  isSaving: boolean
  isSensitive: boolean
  showValue: boolean
  onChange: (v: string) => void
  onToggleVisible: () => void
  onReset: () => void
  onSave: () => void
  showCategory?: boolean
  categoryLabel?: string
}) {
  const isBoolean = value === 'true' || value === 'false' || setting.value === 'true' || setting.value === 'false'
  const isLong = (value?.length ?? 0) > 100 ||
                  setting.key.endsWith('_message') ||
                  setting.key.endsWith('_policy') ||
                  setting.key.endsWith('_body') ||
                  setting.key.endsWith('_about') ||
                  setting.key === 'testimonials_json' ||
                  setting.key.includes('_links') ||
                  setting.key.startsWith('seo_meta_description')
  const isNumber = /^(price|max|min|stat\d|.*_percent|.*_days|.*_hours|.*_nights|.*_mb|stats_)/.test(setting.key) && !setting.key.includes('color')
  const isColor = setting.key.includes('color')
  const isUrl = setting.key.includes('_url') || setting.key.includes('_image') || setting.key.endsWith('_link')

  const stateClass = isPending ? 'border-amber-500/50 bg-amber-50/40 dark:bg-amber-500/5' :
                     isSaved   ? 'border-green-500/40 bg-green-50/40 dark:bg-green-500/5' :
                     'border-border'

  return (
    <Card className={`transition-colors ${stateClass}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{setting.label}</span>
              {showCategory && categoryLabel && (
                <Badge className="bg-muted text-muted-foreground border-border text-[10px] px-1.5 py-0">{categoryLabel}</Badge>
              )}
              {isSensitive && (
                <Badge className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 text-[10px] px-1.5 py-0">
                  <Lock className="w-2.5 h-2.5 mr-0.5" />Secret
                </Badge>
              )}
              {isPending && (
                <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 text-[10px] px-1.5 py-0">
                  Unsaved
                </Badge>
              )}
              {isSaved && (
                <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900 text-[10px] px-1.5 py-0">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Saved
                </Badge>
              )}
            </div>
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
            )}
            <code className="text-[10px] text-muted-foreground/60 font-mono">{setting.key}</code>
          </div>

          {/* Boolean inline switch */}
          {isBoolean && (
            <Switch
              checked={value === 'true'}
              onCheckedChange={c => onChange(c ? 'true' : 'false')}
            />
          )}
        </div>

        {!isBoolean && (
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">
              {isLong ? (
                <Textarea
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  rows={Math.min(10, Math.max(3, value.split('\n').length))}
                  className="text-sm font-mono"
                  placeholder={isSensitive ? '●●●●●●●●' : ''}
                />
              ) : isColor ? (
                <div className="flex gap-2">
                  <Input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="h-9 w-14 p-1 cursor-pointer" />
                  <Input value={value} onChange={e => onChange(e.target.value)} className="h-9 flex-1 font-mono text-sm" placeholder="#1a6b3c" />
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type={isSensitive && !showValue ? 'password' : isNumber ? 'number' : 'text'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={isSensitive ? '●●●●●●●●' : isUrl ? 'https://...' : ''}
                    className="h-9 text-sm pr-9"
                  />
                  {isSensitive && (
                    <button
                      type="button"
                      onClick={onToggleVisible}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {isPending && (
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={onReset} title="Discard change">
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                className="h-9 bg-forest-700 hover:bg-forest-800 text-white px-3"
                onClick={onSave}
                disabled={isSaving || !isPending}
                title="Save this field"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
