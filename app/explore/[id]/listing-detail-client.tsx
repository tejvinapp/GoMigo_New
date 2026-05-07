'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import {
  MapPin, Star, Phone, Wifi, Car, Waves, Wind, Coffee, Utensils,
  Users, BedDouble, Bath, Heart, Share2, ArrowLeft, CheckCircle,
  Calendar, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RatingStars } from '@/components/ui/RatingStars'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useSupabase } from '@/components/providers'
import type { Property, PropertyImage, Review } from '@/types/database'

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), { ssr: false })

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />, parking: <Car className="w-4 h-4" />,
  pool: <Waves className="w-4 h-4" />, ac: <Wind className="w-4 h-4" />,
  kitchen: <Utensils className="w-4 h-4" />, breakfast: <Coffee className="w-4 h-4" />,
}

interface Props {
  property: Property
  images: PropertyImage[]
  reviews: Array<Review & { reviewer: { name: string | null; avatar_url: string | null } | null }>
  nearby: Array<{ name: string; type: string; lat: number; lng: number }>
  settings: Record<string, string>
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export default function ListingDetailClient({ property, images, reviews, nearby, settings }: Props) {
  const { user } = useSupabase()
  const router = useRouter()
  const [imgIdx, setImgIdx] = useState(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const advancePct = parseInt(settings.advance_payment_percent || '20')
  const bookingEnabled = settings.feature_online_booking !== 'false'
  const upiEnabled = settings.feature_upi_payment !== 'false'
  const razorpayKeyId = settings.razorpay_key_id

  const allImages = images.length > 0 ? images.map(i => i.url) : (property.cover_image ? [property.cover_image] : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'])
  const officialImages = images.filter(i => i.is_official).map(i => i.url)
  const customerImages = images.filter(i => !i.is_official && !i.disputed).map(i => i.url)
  const disputedImages = images.filter(i => i.disputed).map(i => i.url)

  const nights = checkIn && checkOut ? Math.max(0, differenceInDays(new Date(checkOut), new Date(checkIn))) : 0
  const totalAmount = nights * property.price_per_night
  const advanceAmount = Math.round(totalAmount * advancePct / 100)

  useEffect(() => {
    // Load Razorpay script
    if (bookingEnabled && razorpayKeyId) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
      return () => { document.body.removeChild(script) }
    }
  }, [bookingEnabled, razorpayKeyId])

  async function handleBookNow() {
    if (!user) { router.push('/auth'); return }
    if (!checkIn || !checkOut || nights <= 0) {
      toast.error('Please select valid check-in and check-out dates')
      return
    }

    setPaymentLoading(true)
    try {
      // 1. Create booking record
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id, check_in: checkIn, check_out: checkOut, guests }),
      })
      const booking = await bookingRes.json()
      if (!bookingRes.ok) throw new Error(booking.error || 'Booking failed')

      // 2. Create Razorpay order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.id, amount: advanceAmount }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error || 'Payment setup failed')

      // 3. Open Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: 'INR',
        name: 'GoMiGooo!',
        description: `Advance for ${property.title}`,
        order_id: order.id,
        prefill: { name: user.user_metadata?.full_name, email: user.email },
        config: {
          display: { preferences: { show_default_blocks: !upiEnabled } },
          blocks: upiEnabled ? { utib: { name: 'Pay by UPI', instruments: [{ method: 'upi' }] }, other: { name: 'Other Payment Modes', instruments: [{ method: 'card' }, { method: 'netbanking' }] } } : undefined,
          sequence: upiEnabled ? ['block.utib', 'block.other'] : undefined,
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, booking_id: booking.id }),
          })
          if (verifyRes.ok) {
            toast.success('Booking confirmed! 🎉')
            router.push('/customer/bookings')
          } else {
            toast.error('Payment verification failed. Please contact support.')
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
        theme: { color: '#1a6b3c' },
      }
      new window.Razorpay(options).open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setPaymentLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warmwhite">
      {/* Back nav */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/explore"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
        </Button>
        <Link href="/landing" className="font-serif text-lg font-bold text-forest-700">GoMiGooo!</Link>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info('Link copied!')}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFavorited(!isFavorited)}>
            <Heart className={isFavorited ? 'w-4 h-4 fill-red-500 text-red-500' : 'w-4 h-4'} />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{property.title}</h1>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <RatingStars rating={property.rating} count={property.review_count} size="md" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {property.location}
          </div>
          <Badge className="bg-forest-50 text-forest-700 border-forest-200 capitalize">{property.type}</Badge>
        </div>

        {/* Photo gallery */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-black">
          <div className="relative h-72 sm:h-96">
            <Image
              src={allImages[imgIdx] ?? allImages[0]}
              alt={`${property.title} photo ${imgIdx + 1}`}
              fill
              className="object-cover"
              priority={imgIdx === 0}
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setImgIdx(i => (i + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {imgIdx + 1}/{allImages.length}
                </div>
              </>
            )}
            {images[imgIdx]?.is_official === false && (
              <Badge className="absolute top-3 left-3 bg-blue-500/80 text-white border-transparent text-xs backdrop-blur-sm">
                Guest photo
              </Badge>
            )}
          </div>
          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-1.5 p-2 overflow-x-auto bg-black/90">
              {allImages.slice(0, 10).map((url, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`relative shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-white' : 'border-transparent opacity-60 hover:opacity-90'}`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Users className="w-5 h-5" />, label: 'Guests', value: `Up to ${property.max_guests}` },
                { icon: <BedDouble className="w-5 h-5" />, label: 'Bedrooms', value: property.bedrooms },
                { icon: <Bath className="w-5 h-5" />, label: 'Bathrooms', value: property.bathrooms },
              ].map(stat => (
                <div key={stat.label} className="bg-card rounded-xl p-4 border border-border text-center">
                  <div className="flex justify-center text-forest-700 mb-2">{stat.icon}</div>
                  <div className="font-semibold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-serif font-semibold mb-3">About this place</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.ai_description || property.description || 'A wonderful property in ' + property.city + '. Contact the owner for more details.'}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-serif font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map(amenity => (
                    <div key={amenity} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border text-sm">
                      <span className="text-forest-700">{AMENITY_ICONS[amenity.toLowerCase()] ?? <CheckCircle className="w-4 h-4" />}</span>
                      <span className="capitalize text-foreground">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="text-xl font-serif font-semibold mb-4">Location</h2>
              <div className="h-64 rounded-xl overflow-hidden">
                <LeafletMap properties={[property]} center={[property.lat, property.lng]} zoom={14} />
              </div>
              {nearby.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-sm mb-2">Nearby Attractions</h3>
                  <div className="flex flex-wrap gap-2">
                    {nearby.slice(0, 8).map(place => (
                      <Badge key={place.name} variant="outline" className="capitalize">
                        <MapPin className="w-3 h-3 mr-1" />{place.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-serif font-semibold">Reviews</h2>
                <RatingStars rating={property.rating} count={property.review_count} size="md" />
              </div>
              {reviews.length === 0 ? (
                <div className="bg-card rounded-xl p-6 border border-border text-center text-muted-foreground text-sm">
                  No reviews yet. Be the first to review after your stay!
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-card rounded-xl p-5 border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={review.reviewer?.avatar_url ?? ''} />
                            <AvatarFallback>{review.reviewer?.name?.[0] ?? 'G'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{review.reviewer?.name ?? 'Guest'}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(review.created_at), 'MMM yyyy')}
                              {review.verified_stay && (
                                <span className="ml-2 text-forest-700">✓ Verified Stay</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <RatingStars rating={review.overall_rating} size="sm" />
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                      {review.owner_reply && (
                        <div className="mt-3 pl-4 border-l-2 border-forest-200">
                          <div className="text-xs text-forest-700 font-medium mb-1">Owner&apos;s response:</div>
                          <p className="text-sm text-muted-foreground">{review.owner_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-card rounded-2xl border border-border shadow-lg p-6">
              <div className="flex items-baseline gap-2 mb-6">
                <PriceDisplay amount={property.price_per_night} size="lg" />
                <span className="text-muted-foreground text-sm">/ night</span>
              </div>

              {property.phone && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full mb-3 h-11 border-forest-700 text-forest-700 hover:bg-forest-50 rounded-xl"
                >
                  <a href={`tel:${property.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call Owner Directly
                  </a>
                </Button>
              )}

              {bookingEnabled && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">CHECK-IN</Label>
                        <Input
                          type="date"
                          value={checkIn}
                          onChange={e => setCheckIn(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="h-10 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">CHECK-OUT</Label>
                        <Input
                          type="date"
                          value={checkOut}
                          onChange={e => setCheckOut(e.target.value)}
                          min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                          className="h-10 text-sm mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">GUESTS</Label>
                      <Input
                        type="number"
                        value={guests}
                        onChange={e => setGuests(parseInt(e.target.value))}
                        min={1}
                        max={property.max_guests}
                        className="h-10 text-sm mt-1"
                      />
                    </div>
                  </div>

                  {nights > 0 && (
                    <div className="bg-warmwhite rounded-xl p-4 mb-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(property.price_per_night)} × {nights} nights
                        </span>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-forest-700">
                        <span>Pay now ({advancePct}% advance)</span>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(advanceAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Balance on arrival</span>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount - advanceAmount)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleBookNow}
                    disabled={paymentLoading}
                    className="w-full h-12 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-semibold text-base"
                  >
                    {paymentLoading ? 'Processing...' : nights > 0 ? `Pay ₹${advanceAmount.toLocaleString('en-IN')} to Book` : 'Select Dates to Book'}
                  </Button>

                  {upiEnabled && (
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Pay via UPI, Card or Netbanking
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 text-center text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3 inline mr-1 text-forest-700" />
                Zero commission — you pay the owner directly
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
