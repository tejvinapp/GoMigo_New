'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Compass, Calendar, Heart, ArrowLeft, MapPin, Phone, Briefcase } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { RatingStars } from '@/components/ui/RatingStars'
import { useSupabase } from '@/components/providers'
import type { User, Property, Booking } from '@/types/database'

interface Props {
  user: User
  bookings: Array<Booking & { property: { id: string; title: string; city: string; cover_image: string | null; phone: string | null; rating: number } | null }>
  favorites: Property[]
}

export default function CustomerDashboardClient({ user, bookings, favorites }: Props) {
  const { supabase } = useSupabase()

  return (
    <div className="min-h-screen bg-warmwhite">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/explore"><ArrowLeft className="w-4 h-4 mr-1" />Explore</Link>
        </Button>
        <Link href="/" className="font-serif text-lg font-bold text-forest-700 dark:text-forest-400">GoMiGooo!</Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8 p-5 bg-card rounded-2xl border border-border shadow-sm">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar_url ?? ''} />
            <AvatarFallback className="text-xl bg-forest-50 text-forest-700">{user.name?.[0] ?? 'T'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-serif font-bold">{user.name ?? 'Traveler'}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            {user.phone && <p className="text-muted-foreground text-sm">{user.phone}</p>}
          </div>
        </div>

        {/* Become a vendor invite */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-forest-700 to-forest-600 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Got something to offer travelers?</div>
              <div className="text-xs text-white/80">List your property, drive cabs, guide tours, or run a shop</div>
            </div>
          </div>
          <Button asChild size="sm" className="bg-white text-forest-700 hover:bg-white/90 shrink-0">
            <Link href="/become-vendor">Join</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Trips', value: bookings.filter(b => b.status === 'completed').length },
            { label: 'Bookings', value: bookings.length },
            { label: 'Saved', value: favorites.length },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl p-4 border border-border text-center shadow-sm">
              <div className="text-2xl font-bold text-forest-700">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings">
          <TabsList className="mb-4 bg-muted rounded-xl">
            <TabsTrigger value="bookings" className="rounded-lg">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />My Bookings
            </TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-lg">
              <Heart className="w-3.5 h-3.5 mr-1.5" />Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">No bookings yet</h3>
                <Button asChild className="bg-forest-700 text-white hover:bg-forest-800">
                  <Link href="/explore"><Compass className="w-4 h-4 mr-2" />Explore Stays</Link>
                </Button>
              </Card>
            ) : (
              bookings.map(b => (
                <Card key={b.id} className="overflow-hidden">
                  <div className="flex">
                    {b.property?.cover_image && (
                      <div className="relative w-24 h-full shrink-0">
                        <Image src={b.property.cover_image} alt={b.property.title ?? ''} fill className="object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/explore/${b.property?.id}`} className="font-semibold text-foreground hover:text-forest-700 hover:underline">
                          {b.property?.title}
                        </Link>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />{b.property?.city}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(b.check_in), 'dd MMM')} – {format(new Date(b.check_out), 'dd MMM yyyy')}
                        &nbsp;·&nbsp;{b.nights} nights&nbsp;·&nbsp;{b.guests} guests
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Paid: </span>
                          <span className="text-sm font-medium text-forest-700">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.advance_paid)}
                          </span>
                          {b.balance_due > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              + {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.balance_due)} on arrival
                            </span>
                          )}
                        </div>
                        {b.property?.phone && (
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs border-forest-700 text-forest-700">
                            <a href={`tel:${b.property.phone}`}><Phone className="w-3 h-3 mr-1" />Call</a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favorites.length === 0 ? (
              <Card className="text-center py-12">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">No saved properties</h3>
                <p className="text-sm text-muted-foreground mb-4">Heart listings you love to save them here</p>
                <Button asChild className="bg-forest-700 text-white hover:bg-forest-800">
                  <Link href="/explore">Browse Stays</Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.map(p => (
                  <Link key={p.id} href={`/explore/${p.id}`} className="block bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-40">
                      {p.cover_image ? <Image src={p.cover_image} alt={p.title} fill className="object-cover" /> : <div className="w-full h-full gradient-hero" />}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm text-foreground mb-1 line-clamp-1">{p.title}</div>
                      <div className="flex items-center justify-between">
                        <PriceDisplay amount={p.price_per_night} suffix="/night" size="sm" />
                        {p.rating > 0 && <RatingStars rating={p.rating} count={p.review_count} />}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
