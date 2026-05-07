'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  LayoutDashboard, Building2, Car, Users, ShoppingBag,
  TrendingUp, Calendar, Star, Settings, LogOut, Bell,
  Plus, CheckCircle, XCircle, AlertCircle, Upload,
  DollarSign, Eye, BarChart2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { RatingStars } from '@/components/ui/RatingStars'
import { useSupabase } from '@/components/providers'
import { toast } from 'sonner'
import type { User, Property, Booking, Subscription, BookingStatus } from '@/types/database'

interface Props {
  user: User
  properties: Array<Property & { images: Array<{ url: string; is_official: boolean }> }>
  bookings: Array<Booking & {
    customer: { name: string | null; phone: string | null; avatar_url: string | null } | null
    property: { title: string; cover_image: string | null } | null
  }>
  subscription: Subscription | null
}

const PLAN_INFO = {
  starter: { name: 'Starter', color: 'bg-gray-100 text-gray-700' },
  pro: { name: 'Pro', color: 'bg-blue-100 text-blue-700' },
  premium: { name: 'Premium', color: 'bg-golden-100 text-golden-700' },
}

export default function OwnerDashboardClient({ user, properties, bookings, subscription }: Props) {
  const { supabase } = useSupabase()
  const [activeTab, setActiveTab] = useState('overview')
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null)

  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.total_amount, 0)
  const pendingBookings = bookings.filter(b => b.status === 'advance_paid')
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const totalViews = properties.reduce((sum, p) => sum + p.view_count, 0)

  async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    setUpdatingBooking(bookingId)
    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)
    if (error) toast.error('Failed to update booking')
    else toast.success(`Booking ${status}`)
    setUpdatingBooking(null)
  }

  async function generateAIDescription(propertyId: string) {
    const property = properties.find(p => p.id === propertyId)
    if (!property) return
    toast.info('Generating AI description...')
    const res = await fetch('/api/ai/description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId }),
    })
    if (res.ok) toast.success('AI description generated!')
    else toast.error('Failed to generate description')
  }

  const navItems = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview', value: 'overview' },
    { icon: <Building2 className="w-4 h-4" />, label: 'Listings', value: 'listings' },
    { icon: <Calendar className="w-4 h-4" />, label: 'Bookings', value: 'bookings' },
    { icon: <BarChart2 className="w-4 h-4" />, label: 'Analytics', value: 'analytics' },
    { icon: <Settings className="w-4 h-4" />, label: 'Subscription', value: 'subscription' },
  ]

  return (
    <div className="min-h-screen bg-warmwhite flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col p-4 shrink-0">
        <Link href="/landing" className="font-serif text-xl font-bold text-forest-700 mb-6 block">
          GoMiGooo!
        </Link>
        <div className="flex items-center gap-3 mb-6 p-3 bg-forest-50 rounded-xl">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user.avatar_url ?? ''} />
            <AvatarFallback>{user.name?.[0] ?? 'O'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium line-clamp-1">{user.name ?? 'Owner'}</div>
            <div className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === item.value
                  ? 'bg-forest-700 text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          className="mt-auto text-muted-foreground hover:text-foreground"
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
        >
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <Link href="/landing" className="font-serif text-xl font-bold text-forest-700">GoMiGooo!</Link>
          <div className="flex gap-2">
            {navItems.map(item => (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`p-2 rounded-lg ${activeTab === item.value ? 'bg-forest-700 text-white' : 'text-muted-foreground'}`}
                title={item.label}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
              <Button asChild size="sm" className="bg-forest-700 hover:bg-forest-800 text-white rounded-xl">
                <Link href="/owner/listings/new"><Plus className="w-4 h-4 mr-1" />Add Listing</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: <PriceDisplay amount={totalRevenue} />, icon: <DollarSign className="w-5 h-5" />, color: 'text-forest-700 bg-forest-50' },
                { label: 'Active Listings', value: properties.filter(p => p.status === 'active').length, icon: <Building2 className="w-5 h-5" />, color: 'text-blue-700 bg-blue-50' },
                { label: 'Pending Bookings', value: pendingBookings.length, icon: <AlertCircle className="w-5 h-5" />, color: 'text-golden-700 bg-golden-50' },
                { label: 'Total Views', value: totalViews.toLocaleString('en-IN'), icon: <Eye className="w-5 h-5" />, color: 'text-purple-700 bg-purple-50' },
              ].map(stat => (
                <Card key={stat.label} className="border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                      {stat.icon}
                    </div>
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pending bookings alert */}
            {pendingBookings.length > 0 && (
              <Card className="border-golden-200 bg-golden-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-golden-700 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {pendingBookings.length} booking{pendingBookings.length > 1 ? 's' : ''} awaiting your confirmation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingBookings.slice(0, 3).map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-card rounded-xl p-3">
                      <div>
                        <div className="text-sm font-medium">{b.customer?.name ?? 'Guest'}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(b.check_in), 'dd MMM')} – {format(new Date(b.check_out), 'dd MMM')} · {b.guests} guests
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 bg-forest-700 hover:bg-forest-800 text-white rounded-lg"
                          onClick={() => updateBookingStatus(b.id, 'confirmed')}
                          disabled={updatingBooking === b.id}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                          onClick={() => updateBookingStatus(b.id, 'cancelled')}
                          disabled={updatingBooking === b.id}
                        >
                          <XCircle className="w-3 h-3 mr-1" />Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent bookings */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Bookings</CardTitle></CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No bookings yet. Your listings need to be active and approved.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.slice(0, 10).map(b => (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback>{b.customer?.name?.[0] ?? 'G'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">{b.customer?.name ?? 'Guest'}</div>
                                {b.customer?.phone && <a href={`tel:${b.customer.phone}`} className="text-xs text-forest-700">{b.customer.phone}</a>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{b.property?.title ?? '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(b.check_in), 'dd MMM')} – {format(new Date(b.check_out), 'dd MMM yyyy')}
                            <div>{b.nights} nights · {b.guests} guests</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <PriceDisplay amount={b.total_amount} size="sm" />
                              <div className="text-xs text-muted-foreground">
                                Advance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.advance_paid)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={b.status} /></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {b.status === 'advance_paid' && (
                                <>
                                  <Button size="sm" className="h-7 text-xs bg-forest-700 text-white hover:bg-forest-800" onClick={() => updateBookingStatus(b.id, 'confirmed')}>Confirm</Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => updateBookingStatus(b.id, 'cancelled')}>Decline</Button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <Button size="sm" className="h-7 text-xs bg-blue-600 text-white hover:bg-blue-700" onClick={() => updateBookingStatus(b.id, 'checked_in')}>Check-In</Button>
                              )}
                              {b.status === 'checked_in' && (
                                <Button size="sm" className="h-7 text-xs bg-gray-600 text-white hover:bg-gray-700" onClick={() => updateBookingStatus(b.id, 'completed')}>Complete</Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-serif font-bold">My Listings</h1>
              <Button asChild size="sm" className="bg-forest-700 hover:bg-forest-800 text-white rounded-xl">
                <Link href="/owner/listings/new"><Plus className="w-4 h-4 mr-1" />New Listing</Link>
              </Button>
            </div>
            {properties.length === 0 ? (
              <Card className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No listings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add your first property to start receiving bookings</p>
                <Button asChild className="bg-forest-700 text-white hover:bg-forest-800">
                  <Link href="/owner/listings/new">Add Property</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map(p => (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="relative h-40">
                      {p.cover_image ? (
                        <Image src={p.cover_image} alt={p.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-hero" />
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className={p.status === 'active' ? 'bg-green-500 text-white border-transparent' : 'bg-yellow-500 text-white border-transparent'}>
                          {p.status === 'active' ? '✓ Live' : p.status}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <PriceDisplay amount={p.price_per_night} suffix="/night" size="sm" />
                        {p.rating > 0 && <RatingStars rating={p.rating} count={p.review_count} />}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild>
                          <Link href={`/explore/${p.id}`}><Eye className="w-3 h-3 mr-1" />View</Link>
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild>
                          <Link href={`/owner/listings/${p.id}/edit`}>Edit</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={() => generateAIDescription(p.id)}
                        >
                          ✨ AI Desc
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-serif font-bold">All Bookings</h1>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Advance</TableHead>
                      <TableHead>Balance Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{b.customer?.name ?? 'Guest'}</div>
                          {b.customer?.phone && (
                            <a href={`tel:${b.customer.phone}`} className="text-xs text-forest-700 hover:underline">{b.customer.phone}</a>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.property?.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(b.check_in), 'dd MMM')} – {format(new Date(b.check_out), 'dd MMM')}
                        </TableCell>
                        <TableCell><PriceDisplay amount={b.total_amount} size="sm" /></TableCell>
                        <TableCell className="text-forest-700 text-sm font-medium">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.advance_paid)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.balance_due)}
                        </TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold">Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Revenue', value: <PriceDisplay amount={totalRevenue} size="lg" />, note: 'Zero commission deducted' },
                { label: 'Booking Rate', value: `${properties.length > 0 ? Math.round((bookings.filter(b => b.status !== 'cancelled').length / Math.max(totalViews, 1)) * 100) : 0}%`, note: 'Bookings per 100 views' },
                { label: 'Avg. Stay Duration', value: `${bookings.length > 0 ? Math.round(bookings.reduce((s, b) => s + b.nights, 0) / bookings.length) : 0} nights`, note: 'Average across all bookings' },
              ].map(card => (
                <Card key={card.label}>
                  <CardContent className="p-5">
                    <div className="text-2xl font-bold text-foreground mb-1">{card.value}</div>
                    <div className="text-sm font-medium text-foreground">{card.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{card.note}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Earnings (Direct — 0% Commission)</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Revenue chart will populate as bookings are completed. Every rupee goes directly to you.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold">Subscription</h1>
            {subscription ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold">{PLAN_INFO[subscription.plan]?.name ?? subscription.plan} Plan</div>
                      <div className="text-muted-foreground text-sm">
                        {subscription.current_period_end
                          ? `Renews on ${format(new Date(subscription.current_period_end), 'dd MMM yyyy')}`
                          : 'Active subscription'}
                      </div>
                    </div>
                    <Badge className={`${PLAN_INFO[subscription.plan]?.color ?? ''} border-transparent`}>
                      {subscription.status === 'active' ? '✓ Active' : subscription.status}
                    </Badge>
                  </div>
                  <PriceDisplay amount={subscription.amount} suffix="/month" size="lg" />
                  <p className="text-sm text-muted-foreground mt-2">Zero commission on all bookings. You keep 100%.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">No active subscription</h3>
                  <p className="text-sm text-muted-foreground mb-4">Subscribe to list your property and start receiving bookings.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[{ plan: 'Starter', price: 299 }, { plan: 'Pro', price: 599 }, { plan: 'Premium', price: 999 }].map(p => (
                      <Button key={p.plan} className="bg-forest-700 hover:bg-forest-800 text-white" onClick={() => toast.info('Subscription flow coming soon!')}>
                        {p.plan} — ₹{p.price}/mo
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
