'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, SlidersHorizontal, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ListingCard } from '@/components/cards/ListingCard'
import type { Property } from '@/types/database'

// Dynamic import in the client component (where it belongs) so we don't pass a function across the server/client boundary
const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-xl flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading map...</div>
    </div>
  ),
})

interface Props {
  properties: Array<Property & { images: Array<{ url: string; is_official: boolean; sort_order: number }> }>
  initialFilters: { q: string; type: string; destination: string }
}

const PROPERTY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'cottage', label: 'Cottages' },
  { value: 'homestay', label: 'Homestays' },
  { value: 'resort', label: 'Resorts' },
  { value: 'camping', label: 'Camping' },
]

const AMENITY_OPTIONS = ['wifi', 'parking', 'pool', 'ac', 'kitchen', 'gym', 'spa', 'pets']

export default function ExploreClient({ properties, initialFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [search, setSearch] = useState(initialFilters.q)
  const [typeFilter, setTypeFilter] = useState(initialFilters.type)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(true)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [minRating, setMinRating] = useState('')

  // Client-side filter (on top of server-filtered results)
  const filtered = useMemo(() => {
    return properties.filter(p => {
      if (search && !`${p.title} ${p.city} ${p.state}`.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter && typeFilter !== 'all' && p.type !== typeFilter) return false
      if (priceMin && p.price_per_night < parseFloat(priceMin)) return false
      if (priceMax && p.price_per_night > parseFloat(priceMax)) return false
      if (minRating && p.rating < parseFloat(minRating)) return false
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => p.amenities.includes(a))) return false
      return true
    })
  }, [properties, search, typeFilter, priceMin, priceMax, minRating, selectedAmenities])

  const mapCenter: [number, number] = filtered.length > 0
    ? [filtered[0].lat, filtered[0].lng]
    : [11.4102, 76.6950]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const url = new URL(pathname, window.location.origin)
    if (search) url.searchParams.set('q', search)
    else url.searchParams.delete('q')
    if (typeFilter && typeFilter !== 'all') url.searchParams.set('type', typeFilter)
    router.push(url.pathname + url.search)
  }

  function toggleAmenity(a: string) {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    )
  }

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">Property Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`text-sm px-3 py-2 rounded-lg border transition-all ${
                typeFilter === t.value
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'border-border hover:border-forest-700 text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">Price Range (₹/night)</h3>
        <div className="flex gap-2">
          <Input placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} type="number" className="h-9" />
          <Input placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} type="number" className="h-9" />
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">Minimum Rating</h3>
        <Select value={minRating || 'any'} onValueChange={v => setMinRating(v === 'any' ? '' : (v ?? ''))}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any rating</SelectItem>
            {['3', '3.5', '4', '4.5'].map(r => (
              <SelectItem key={r} value={r}>{r}+ stars</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map(a => (
            <button
              key={a}
              onClick={() => toggleAmenity(a)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${
                selectedAmenities.includes(a)
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'border-border hover:border-forest-700 text-muted-foreground'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      {(priceMin || priceMax || minRating || selectedAmenities.length > 0 || (typeFilter && typeFilter !== 'all')) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPriceMin(''); setPriceMax(''); setMinRating('')
            setSelectedAmenities([]); setTypeFilter('all')
          }}
          className="w-full text-muted-foreground"
        >
          <X className="w-3 h-3 mr-1" /> Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/landing" className="font-serif text-xl font-bold text-forest-700 shrink-0">
          GoMiGooo!
        </Link>
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search destination, property..."
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 bg-forest-700 hover:bg-forest-800 text-white">
            Search
          </Button>
        </form>

        {/* Mobile filter sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 md:hidden shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto">
              <FilterPanel />
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
          className="h-9 shrink-0 hidden md:flex"
        >
          <MapPin className="w-4 h-4 mr-1.5" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop filter sidebar */}
        <div className="hidden md:block w-64 border-r border-border bg-white overflow-y-auto p-4 shrink-0">
          <h2 className="font-semibold text-sm text-foreground mb-4">Filters</h2>
          <FilterPanel />
        </div>

        {/* Listings */}
        <div className={`flex-1 overflow-y-auto bg-warmwhite ${showMap ? 'md:max-w-md lg:max-w-lg' : 'w-full'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> stays found
              </p>
              <Select defaultValue="rating">
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No properties found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search in a different area</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filtered.map(p => (
                  <ListingCard
                    key={p.id}
                    property={p}
                    onPropertyClick={() => setSelectedId(p.id)}
                    className={selectedId === p.id ? 'ring-2 ring-forest-700' : ''}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map panel */}
        {showMap && (
          <div className="hidden md:block flex-1 relative">
            <LeafletMap
              properties={filtered}
              center={mapCenter}
              zoom={10}
              selectedId={selectedId}
              onPropertyClick={setSelectedId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
