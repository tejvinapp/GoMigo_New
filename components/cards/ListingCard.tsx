'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Phone, Heart, Wifi, Car, Waves, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RatingStars } from '@/components/ui/RatingStars'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { cn } from '@/lib/utils'
import type { Property } from '@/types/database'

interface Props {
  property: Property & { images?: Array<{ url: string }> }
  distanceKm?: number
  onFavoriteToggle?: (id: string) => void
  isFavorited?: boolean
  className?: string
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  parking: <Car className="w-3 h-3" />,
  pool: <Waves className="w-3 h-3" />,
  ac: <Wind className="w-3 h-3" />,
}

const TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel', cottage: 'Cottage', homestay: 'Homestay', resort: 'Resort', camping: 'Camping',
}

export function ListingCard({ property, distanceKm, onFavoriteToggle, isFavorited = false, className }: Props) {
  const [imgIdx, setImgIdx] = useState(0)
  // Prefer property_images rows, then cover_image, then a final placeholder
  const galleryImages = property.images?.length ? property.images.map(i => i.url) : []
  const images = galleryImages.length ? galleryImages : (property.cover_image ? [property.cover_image] : [])
  const displayImage = images[imgIdx] ?? images[0] ?? 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80'

  return (
    <div className={cn('group rounded-2xl overflow-hidden bg-card text-card-foreground border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col', className)}>
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={displayImage}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 text-forest-700 border-transparent text-xs font-medium">
            {TYPE_LABELS[property.type] ?? property.type}
          </Badge>
        </div>

        {/* Favorite button */}
        {onFavoriteToggle && (
          <button
            onClick={e => { e.preventDefault(); onFavoriteToggle(property.id) }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart className={cn('w-4 h-4 transition-colors', isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
          </button>
        )}

        {/* Image navigation dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {images.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={e => { e.preventDefault(); setImgIdx(i) }}
                className={cn('w-1.5 h-1.5 rounded-full transition-all', i === imgIdx ? 'bg-white w-3' : 'bg-white/60')}
              />
            ))}
          </div>
        )}

        {/* Distance */}
        {distanceKm !== undefined && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-black/50 text-white border-transparent text-xs backdrop-blur-sm">
              <MapPin className="w-3 h-3 mr-1" />{distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground leading-tight line-clamp-2 flex-1">{property.title}</h3>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />
          {property.city}, {property.state}
        </div>

        {property.rating > 0 && (
          <RatingStars rating={property.rating} count={property.review_count} className="mb-2" />
        )}

        {/* Amenity icons */}
        {property.amenities.length > 0 && (
          <div className="flex gap-2 mb-3">
            {property.amenities.slice(0, 4).map(amenity => {
              const icon = AMENITY_ICONS[amenity.toLowerCase()]
              return icon ? (
                <div key={amenity} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 py-1">
                  {icon}
                  <span className="capitalize">{amenity}</span>
                </div>
              ) : null
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <PriceDisplay amount={property.price_per_night} suffix="/night" />
          <div className="flex gap-2">
            {property.phone && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 px-3 rounded-lg border-forest-700 text-forest-700 hover:bg-forest-50"
              >
                <a href={`tel:${property.phone}`}>
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </a>
              </Button>
            )}
            <Button
              asChild
              size="sm"
              className="h-8 px-3 rounded-lg bg-forest-700 hover:bg-forest-800 text-white"
            >
              <Link href={`/explore/${property.id}`}>View</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
