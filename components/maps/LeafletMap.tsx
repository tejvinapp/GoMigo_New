'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import type { Property } from '@/types/database'

// Fix default Leaflet marker icons broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// Custom price marker icon
function createPriceIcon(price: number) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

  return L.divIcon({
    html: `<div style="background:#1a6b3c;color:white;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">${formatted}</div>`,
    className: '',
    iconAnchor: [40, 20],
  })
}

// Fly to center when it changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 })
  }, [map, center, zoom])
  return null
}

interface Props {
  properties: Property[]
  center?: [number, number]
  zoom?: number
  selectedId?: string | null
  onPropertyClick?: (id: string) => void
}

export default function LeafletMap({
  properties,
  center = [11.4102, 76.6950],
  zoom = 10,
  selectedId,
  onPropertyClick,
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} zoom={zoom} />

      {properties.map(property => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
          icon={createPriceIcon(property.price_per_night)}
          eventHandlers={{
            click: () => onPropertyClick?.(property.id),
          }}
        >
          <Popup className="leaflet-popup-custom">
            <div className="w-48 p-0">
              {property.cover_image && (
                <div className="relative h-28 rounded-t-xl overflow-hidden">
                  <img
                    src={property.cover_image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">{property.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{property.city}</p>
                <div className="flex items-center justify-between">
                  <PriceDisplay amount={property.price_per_night} suffix="/night" size="sm" />
                  <Link
                    href={`/explore/${property.id}`}
                    className="text-xs text-forest-700 font-medium hover:underline"
                  >
                    View →
                  </Link>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
