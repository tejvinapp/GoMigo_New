'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CreditCard, Mail, Bot, Layout, Package, Zap, Eye, EyeOff, Save,
  Palette, Search, BarChart, Calendar, Lock, Bell, Languages, RefreshCw,
  Scale, Phone, Wrench, MessageSquare, Settings as SettingsIcon
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
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  payments:     { label: 'Payments', icon: CreditCard, description: 'Razorpay credentials for cards, UPI, and subscriptions.', helpUrl: { label: 'dashboard.razorpay.com', href: 'https://dashboard.razorpay.com' } },
  email:        { label: 'Email', icon: Mail, description: 'Resend API for booking confirmations and notifications.', helpUrl: { label: 'resend.com', href: 'https://resend.com' } },
  ai:           { label: 'AI', icon: Bot, description: 'Anthropic Claude API for AI listing descriptions and trip planner.', helpUrl: { label: 'console.anthropic.com', href: 'https://console.anthropic.com/settings/keys' } },
  content:      { label: 'Content', icon: Layout, description: 'Hero copy, stats, testimonials, and other site copy.' },
  pricing:      { label: 'Pricing', icon: Package, description: 'Owner subscription plan amounts and feature lists.' },
  features:     { label: 'Features', icon: Zap, description: 'Master feature flags — toggle features on/off.' },
  branding:     { label: 'Branding', icon: Palette, description: 'Logo, colors, app name, and tagline.' },
  seo:          { label: 'SEO', icon: Search, description: 'Meta tags and search engine visibility.' },
  analytics:    { label: 'Analytics', icon: BarChart, description: 'Tracking IDs for Google Analytics, Facebook Pixel, etc.' },
  booking:      { label: 'Booking Rules', icon: Calendar, description: 'Advance %, min/max nights, cancellation policy.' },
  limits:       { label: 'Limits', icon: Lock, description: 'Quotas for listings, photos, KYC requirements.' },
  notifications:{ label: 'Notifications', icon: Bell, description: 'Email triggers for various platform events.' },
  localization: { label: 'Localization', icon: Languages, description: 'Default language, currency, timezone.' },
  subscription: { label: 'Subscription', icon: RefreshCw, description: 'Trial days, grace periods, auto-cancel rules.' },
  legal:        { label: 'Legal', icon: Scale, description: 'Terms, privacy, GSTIN, and company info.' },
  contact:      { label: 'Contact & Social', icon: Phone, description: 'Support email/phone and social media links.' },
  operations:   { label: 'Operations', icon: Wrench, description: 'Maintenance mode, signup toggles, system controls.' },
  sms:          { label: 'SMS', icon: MessageSquare, description: 'SMS provider settings (Twilio, MSG91, etc.).' },
}

export default function AdminSettingsClient({ initialSettings }: Props) {
  const { supabase } = useSupabase()
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(initialSettings.map(s => [s.key, s.value ?? '']))
  )
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set())

  const sensitiveKeys = new Set(initialSettings.filter(s => s.sensitive).map(s => s.key))

  const categories = Array.from(new Set(initialSettings.map(s => s.category))).sort()

  function getSettingsByCategory(category: string) {
    return initialSettings.filter(s => s.category === category)
  }

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setPendingChanges(prev => new Set(prev).add(key))
  }

  async function saveSetting(key: string) {
    setSaving(key)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('platform_settings') as any)
      .update({ value: settings[key] })
      .eq('key', key)

    if (error) {
      toast.error(`Failed to save ${key}`)
    } else {
      toast.success('Saved')
      setPendingChanges(prev => { const s = new Set(prev); s.delete(key); return s })
    }
    setSaving(null)
  }

  async function saveCategory(category: string) {
    const categorySettings = getSettingsByCategory(category)
    setSaving(`category_${category}`)
    let saved = 0
    for (const s of categorySettings) {
      if (pendingChanges.has(s.key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('platform_settings') as any)
          .update({ value: settings[s.key] })
          .eq('key', s.key)
        if (!error) saved++
      }
    }
    toast.success(saved === 0 ? 'No changes to save' : `Saved ${saved} setting${saved === 1 ? '' : 's'}`)
    setPendingChanges(prev => {
      const next = new Set(prev)
      categorySettings.forEach(s => next.delete(s.key))
      return next
    })
    setSaving(null)
  }

  async function sendTestEmail() {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' }),
    })
    if (res.ok) toast.success('Test email sent — check your inbox')
    else toast.error('Failed to send test email — check email settings')
  }

  function SettingField({ setting }: { setting: PlatformSetting }) {
    const isSensitive = sensitiveKeys.has(setting.key)
    const isBoolean = setting.value === 'true' || setting.value === 'false'
    const isLong = (setting.value?.length ?? 0) > 80 ||
                   setting.key.endsWith('_message') ||
                   setting.key.endsWith('_policy') ||
                   setting.key.endsWith('_description') ||
                   setting.key === 'testimonials_json' ||
                   setting.key.startsWith('seo_meta_description')
    const isNumber = /price|percent|max|min|days|hours|nights|stats_|_mb$/.test(setting.key) && !setting.key.includes('color')
    const isColor = setting.key.includes('color')
    const hasPendingChange = pendingChanges.has(setting.key)

    if (isBoolean) {
      return (
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{setting.label}</Label>
              {hasPendingChange && <Badge className="text-xs bg-golden-100 text-golden-700 border-golden-200">Unsaved</Badge>}
            </div>
            {setting.description && <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>}
            <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">{setting.key}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={settings[setting.key] === 'true'}
              onCheckedChange={checked => {
                handleChange(setting.key, checked ? 'true' : 'false')
              }}
            />
            <Button
              size="sm"
              className="h-8 bg-forest-700 hover:bg-forest-800 text-white"
              onClick={() => saveSetting(setting.key)}
              disabled={saving === setting.key || !hasPendingChange}
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-1.5 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm font-medium">{setting.label}</Label>
          {isSensitive && <Badge className="text-xs bg-red-50 text-red-600 border-red-200">Confidential</Badge>}
          {hasPendingChange && <Badge className="text-xs bg-golden-100 text-golden-700 border-golden-200">Unsaved</Badge>}
        </div>
        {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
        <p className="text-xs text-muted-foreground/60 font-mono">{setting.key}</p>
        <div className="flex gap-2 items-start">
          <div className="relative flex-1">
            {isLong ? (
              <Textarea
                value={settings[setting.key] ?? ''}
                onChange={e => handleChange(setting.key, e.target.value)}
                placeholder={isSensitive ? '●●●●●●●●' : `Enter ${setting.label.toLowerCase()}`}
                rows={4}
                className="text-sm font-mono"
              />
            ) : isColor ? (
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings[setting.key] || '#000000'}
                  onChange={e => handleChange(setting.key, e.target.value)}
                  className="h-9 w-16 p-1"
                />
                <Input
                  type="text"
                  value={settings[setting.key] ?? ''}
                  onChange={e => handleChange(setting.key, e.target.value)}
                  className="h-9 flex-1 font-mono text-sm"
                />
              </div>
            ) : (
              <Input
                type={isSensitive && !showSensitive[setting.key] ? 'password' : isNumber ? 'number' : 'text'}
                value={settings[setting.key] ?? ''}
                onChange={e => handleChange(setting.key, e.target.value)}
                placeholder={isSensitive ? '●●●●●●●●' : `Enter ${setting.label.toLowerCase()}`}
                className="h-9 pr-10 text-sm"
              />
            )}
            {isSensitive && !isLong && (
              <button
                type="button"
                onClick={() => setShowSensitive(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSensitive[setting.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
          <Button
            size="sm"
            className="h-9 bg-forest-700 hover:bg-forest-800 text-white px-3 shrink-0"
            onClick={() => saveSetting(setting.key)}
            disabled={saving === setting.key || !hasPendingChange}
          >
            <Save className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-2">
        <SettingsIcon className="w-6 h-6 text-forest-700" />
        <h1 className="text-2xl font-serif font-bold">Platform Settings</h1>
        <Badge className="bg-golden-50 text-golden-700 border-golden-200">{initialSettings.length} settings</Badge>
        {pendingChanges.size > 0 && (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
            {pendingChanges.size} unsaved
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Configure every aspect of your platform from here — no code changes needed. Changes take effect immediately.
        Sensitive credentials (API keys, secrets) are encrypted at rest and never exposed to the public site.
      </p>

      <Tabs defaultValue={categories[0]}>
        <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-xl">
          {categories.map(cat => {
            const meta = CATEGORY_META[cat]
            const Icon = meta?.icon ?? SettingsIcon
            return (
              <TabsTrigger key={cat} value={cat} className="rounded-lg text-xs">
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {meta?.label ?? cat}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map(cat => {
          const meta = CATEGORY_META[cat]
          const items = getSettingsByCategory(cat)
          const Icon = meta?.icon ?? SettingsIcon
          return (
            <TabsContent key={cat} value={cat}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-forest-700" />
                    {meta?.label ?? cat} <span className="text-xs text-muted-foreground font-normal">({items.length} fields)</span>
                  </CardTitle>
                  {meta?.description && (
                    <CardDescription>
                      {meta.description}
                      {meta.helpUrl && (
                        <>
                          {' '}Get yours at{' '}
                          <a href={meta.helpUrl.href} target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">
                            {meta.helpUrl.label}
                          </a>
                        </>
                      )}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {items.map(s => <SettingField key={s.key} setting={s} />)}
                  <div className="pt-4 flex flex-wrap gap-3">
                    <Button
                      className="bg-forest-700 hover:bg-forest-800 text-white"
                      onClick={() => saveCategory(cat)}
                      disabled={saving === `category_${cat}`}
                    >
                      <Save className="w-4 h-4 mr-2" />Save All {meta?.label ?? cat}
                    </Button>
                    {cat === 'email' && (
                      <Button variant="outline" onClick={sendTestEmail}>
                        <Mail className="w-4 h-4 mr-2" />Send Test Email
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </main>
  )
}
