import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ArrowLeft, Calendar, MapPin, Phone, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Bookings' }

export default async function CustomerBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      property:property_id(id, title, city, cover_image, phone, rating)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  const all = bookings ?? []
  const upcoming = all.filter(b => ['pending', 'advance_paid', 'confirmed'].includes(b.status))
  const past = all.filter(b => ['completed', 'cancelled', 'refunded', 'checked_in'].includes(b.status))

  return (
    <div className="min-h-screen bg-warmwhite">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customer/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
        </Button>
        <h1 className="font-serif font-bold text-lg">My Bookings</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {all.length === 0 ? (
          <Card className="text-center py-16">
            <Calendar className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-serif font-bold mb-2">No bookings yet</h2>
            <p className="text-muted-foreground mb-6">Explore amazing stays across The Nilgiris</p>
            <Button asChild className="bg-forest-700 hover:bg-forest-800 text-white">
              <Link href="/explore"><Compass className="w-4 h-4 mr-2" />Explore Stays</Link>
            </Button>
          </Card>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  Past ({past.length})
                </h2>
                <div className="space-y-3">
                  {past.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function BookingCard({ booking: b }: { booking: any }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {b.property?.cover_image && (
          <div className="relative w-28 shrink-0">
            <Image src={b.property.cover_image} alt={b.property.title ?? ''} fill className="object-cover" />
          </div>
        )}
        <CardContent className="p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link
              href={`/explore/${b.property?.id}`}
              className="font-semibold text-sm text-foreground hover:text-forest-700 hover:underline truncate"
            >
              {b.property?.title}
            </Link>
            <StatusBadge status={b.status} />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 shrink-0" />{b.property?.city}
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            {format(new Date(b.check_in), 'dd MMM')} – {format(new Date(b.check_out), 'dd MMM yyyy')}
            &nbsp;·&nbsp;{b.nights} nights&nbsp;·&nbsp;{b.guests} guests
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground text-xs">Paid: </span>
              <span className="font-medium text-forest-700">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(b.advance_paid)}
              </span>
              {b.balance_due > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
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
  )
}
