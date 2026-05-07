'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CreditCard, Mail, Bot, Layout, Package, Zap,
  Eye, EyeOff, Save, ArrowLeft, Users, Building2,
  Image as ImageIcon, FileCheck, BarChart2, Settings
} from 'lucide-react'
import type { PlatformSetting, SettingCategory } from '@/types/database'

interface Props {
  initialSettings: PlatformSetting[]
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

  function getSettingsByCategory(category: SettingCategory) {
    return initialSettings.filter(s => s.category === category)
  }

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setPendingChanges(prev => new Set(prev).add(key))
  }

  function handleBooleanChange(key: string, checked: boolean) {
    handleChange(key, checked ? 'true' : 'false')
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
      toast.success('Saved!')
      setPendingChanges(prev => { const s = new Set(prev); s.delete(key); return s })
    }
    setSaving(null)
  }

  async function saveCategory(category: SettingCategory) {
    const categorySettings = getSettingsByCategory(category)
    setSaving(`category_${category}`)

    for (const s of categorySettings) {
      if (pendingChanges.has(s.key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('platform_settings') as any).update({ value: settings[s.key] }).eq('key', s.key)
      }
    }

    toast.success(`${category} settings saved!`)
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
    if (res.ok) toast.success('Test email sent!')
    else toast.error('Failed to send test email')
  }

  function SettingField({ setting }: { setting: PlatformSetting }) {
    const isSensitive = sensitiveKeys.has(setting.key)
    const isBoolean = setting.value === 'true' || setting.value === 'false'
    const isNumber = setting.key.includes('price') || setting.key.includes('percent') || setting.key.startsWith('stats_')
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
          </div>
          <Switch
            checked={settings[setting.key] === 'true'}
            onCheckedChange={checked => handleBooleanChange(setting.key, checked)}
          />
        </div>
      )
    }

    return (
      <div className="space-y-1.5 py-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{setting.label}</Label>
          {isSensitive && <Badge className="text-xs bg-red-50 text-red-600 border-red-200">Confidential</Badge>}
          {hasPendingChange && <Badge className="text-xs bg-golden-100 text-golden-700 border-golden-200">Unsaved</Badge>}
        </div>
        {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={isSensitive && !showSensitive[setting.key] ? 'password' : isNumber ? 'number' : 'text'}
              value={settings[setting.key] ?? ''}
              onChange={e => handleChange(setting.key, e.target.value)}
              placeholder={isSensitive ? '●●●●●●●●' : `Enter ${setting.label.toLowerCase()}`}
              className="h-9 pr-10 text-sm"
            />
            {isSensitive && (
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

  const adminNavItems = [
    { href: '/admin/dashboard', icon: <BarChart2 className="w-4 h-4" />, label: 'Dashboard' },
    { href: '/admin/users', icon: <Users className="w-4 h-4" />, label: 'Users' },
    { href: '/admin/subscriptions', icon: <Package className="w-4 h-4" />, label: 'Subscriptions' },
    { href: '/admin/photos', icon: <ImageIcon className="w-4 h-4" />, label: 'Photos' },
    { href: '/admin/kyc', icon: <FileCheck className="w-4 h-4" />, label: 'KYC Verification' },
    { href: '/admin/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings', active: true },
  ]

  return (
    <div className="min-h-screen bg-warmwhite flex">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-border flex-col p-4 shrink-0">
        <Link href="/landing" className="font-serif text-xl font-bold text-forest-700 mb-6 block">GoMiGooo!</Link>
        <Badge className="mb-4 bg-red-50 text-red-700 border-red-200 text-xs">Admin Panel</Badge>
        <nav className="space-y-1">
          {adminNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                item.active ? 'bg-forest-700 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.icon}{item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-serif font-bold">Platform Settings</h1>
          <Badge className="bg-golden-50 text-golden-700 border-golden-200">Admin Only</Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Configure all platform settings from here — no code changes needed. Changes take effect immediately.
        </p>

        <Tabs defaultValue="payments">
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-xl">
            <TabsTrigger value="payments" className="rounded-lg"><CreditCard className="w-3.5 h-3.5 mr-1.5" />Payments</TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg"><Mail className="w-3.5 h-3.5 mr-1.5" />Email</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg"><Bot className="w-3.5 h-3.5 mr-1.5" />AI</TabsTrigger>
            <TabsTrigger value="content" className="rounded-lg"><Layout className="w-3.5 h-3.5 mr-1.5" />Content</TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-lg"><Package className="w-3.5 h-3.5 mr-1.5" />Pricing</TabsTrigger>
            <TabsTrigger value="features" className="rounded-lg"><Zap className="w-3.5 h-3.5 mr-1.5" />Features</TabsTrigger>
          </TabsList>

          {/* PAYMENTS */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure Razorpay for collecting advance bookings and subscription fees. Get your keys from{' '}
                  <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">dashboard.razorpay.com</a>
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {getSettingsByCategory('payments').map(s => <SettingField key={s.key} setting={s} />)}
                <div className="pt-4">
                  <Button
                    className="bg-forest-700 hover:bg-forest-800 text-white"
                    onClick={() => saveCategory('payments')}
                    disabled={saving === 'category_payments'}
                  >
                    <Save className="w-4 h-4 mr-2" />Save All Payment Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EMAIL */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>
                  Configure Resend for booking confirmations and notifications. Get your key from{' '}
                  <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">resend.com</a>
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {getSettingsByCategory('email').map(s => <SettingField key={s.key} setting={s} />)}
                <div className="pt-4 flex gap-3">
                  <Button
                    className="bg-forest-700 hover:bg-forest-800 text-white"
                    onClick={() => saveCategory('email')}
                    disabled={saving === 'category_email'}
                  >
                    <Save className="w-4 h-4 mr-2" />Save Email Settings
                  </Button>
                  <Button variant="outline" onClick={sendTestEmail}>
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI */}
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>AI Settings</CardTitle>
                <CardDescription>
                  Configure Claude AI for listing descriptions, trip planning, and photo moderation. Get your API key from{' '}
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline">console.anthropic.com</a>
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {getSettingsByCategory('ai').map(s => <SettingField key={s.key} setting={s} />)}
                <div className="pt-4">
                  <Button
                    className="bg-forest-700 hover:bg-forest-800 text-white"
                    onClick={() => saveCategory('ai')}
                    disabled={saving === 'category_ai'}
                  >
                    <Save className="w-4 h-4 mr-2" />Save AI Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENT */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Site Content</CardTitle>
                <CardDescription>
                  Customize what visitors see on the landing page — headlines, stats, testimonials, and images.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {getSettingsByCategory('content').map(s => (
                  <div key={s.key}>
                    {s.key === 'testimonials_json' ? (
                      <div className="space-y-1.5 py-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">{s.label}</Label>
                          {pendingChanges.has(s.key) && <Badge className="text-xs bg-golden-100 text-golden-700 border-golden-200">Unsaved</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                        <textarea
                          value={settings[s.key] ?? ''}
                          onChange={e => handleChange(s.key, e.target.value)}
                          rows={6}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          placeholder='[{"name":"Name","location":"City","rating":5,"text":"Review text","avatar":"AB"}]'
                        />
                        <Button size="sm" className="bg-forest-700 text-white hover:bg-forest-800 h-8" onClick={() => saveSetting(s.key)} disabled={!pendingChanges.has(s.key)}>
                          <Save className="w-3 h-3 mr-1" />Save
                        </Button>
                      </div>
                    ) : (
                      <SettingField setting={s} />
                    )}
                  </div>
                ))}
                <div className="pt-4">
                  <Button className="bg-forest-700 hover:bg-forest-800 text-white" onClick={() => saveCategory('content')} disabled={saving === 'category_content'}>
                    <Save className="w-4 h-4 mr-2" />Save All Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRICING */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Pricing</CardTitle>
                <CardDescription>
                  Set the monthly subscription prices for property owners. Changes apply to new subscriptions immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {getSettingsByCategory('pricing').map(s => <SettingField key={s.key} setting={s} />)}
                <div className="pt-4">
                  <Button className="bg-forest-700 hover:bg-forest-800 text-white" onClick={() => saveCategory('pricing')} disabled={saving === 'category_pricing'}>
                    <Save className="w-4 h-4 mr-2" />Save Pricing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURES */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Toggle platform features on or off instantly — no code changes required.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {getSettingsByCategory('features').map(s => <SettingField key={s.key} setting={s} />)}
                <div className="pt-4">
                  <Button className="bg-forest-700 hover:bg-forest-800 text-white" onClick={() => saveCategory('features')} disabled={saving === 'category_features'}>
                    <Save className="w-4 h-4 mr-2" />Save Feature Flags
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
