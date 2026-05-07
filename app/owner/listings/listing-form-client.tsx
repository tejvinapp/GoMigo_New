'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, X, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabase } from '@/components/providers'
import { toast } from 'sonner'

const AMENITIES_LIST = [
  'WiFi', 'Parking', 'Pool', 'AC', 'Hot Water', 'Kitchen', 'TV', 'Fireplace',
  'Garden', 'Mountain View', 'Bonfire', 'Trekking', 'Breakfast', 'Heater',
  'Washing Machine', 'Pet Friendly', 'EV Charging', 'Butler Service',
]

const PROPERTY_TYPES = ['hotel', 'cottage', 'homestay', 'resort', 'camping']

interface Props {
  mode: 'create' | 'edit'
  initialData?: any
}

export default function ListingFormClient({ mode, initialData }: Props) {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialData?.cover_image ? [initialData.cover_image] : []
  )

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    type: initialData?.type ?? 'homestay',
    description: initialData?.description ?? '',
    price_per_night: initialData?.price_per_night?.toString() ?? '',
    location: initialData?.location ?? '',
    city: initialData?.city ?? '',
    state: initialData?.state ?? 'Tamil Nadu',
    lat: initialData?.lat?.toString() ?? '',
    lng: initialData?.lng?.toString() ?? '',
    max_guests: initialData?.max_guests?.toString() ?? '2',
    bedrooms: initialData?.bedrooms?.toString() ?? '1',
    bathrooms: initialData?.bathrooms?.toString() ?? '1',
    amenities: (initialData?.amenities ?? []) as string[],
    phone: initialData?.phone ?? '',
  })

  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }))
  }

  async function geocodeLocation() {
    if (!form.city) { toast.error('Enter a city first'); return }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.city + ', India')}&format=json&limit=1`,
        { headers: { 'User-Agent': 'GoMiGooo/1.0 contact@gomigoo.in' } }
      )
      const data = await res.json()
      if (data[0]) {
        setForm(f => ({ ...f, lat: data[0].lat, lng: data[0].lon }))
        toast.success('Location found')
      } else {
        toast.error('Location not found')
      }
    } catch {
      toast.error('Geocoding failed')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !user) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB`); continue }
        const ext = file.name.split('.').pop()
        const path = `owners/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('property-images').upload(path, file)
        if (error) { toast.error(`Failed to upload ${file.name}`); continue }
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(path)
        setUploadedImages(prev => [...prev, publicUrl])
      }
      toast.success('Images uploaded')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(url: string) {
    setUploadedImages(prev => prev.filter(u => u !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!form.title || !form.price_per_night || !form.city || !form.location) {
      toast.error('Fill all required fields')
      return
    }
    if (!form.lat || !form.lng) {
      toast.error('Click "Find on Map" to set location coordinates')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
        price_per_night: parseFloat(form.price_per_night),
        location: form.location.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        max_guests: parseInt(form.max_guests),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        amenities: form.amenities,
        phone: form.phone.trim() || null,
        cover_image: uploadedImages[0] ?? null,
      }

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('properties')
          .insert({ ...payload, owner_id: user.id, status: 'pending' })
          .select('id')
          .single()
        if (error) throw error

        // Insert additional images
        if (uploadedImages.length > 1) {
          await supabase.from('property_images').insert(
            uploadedImages.map((url, i) => ({
              property_id: data.id,
              url,
              is_official: true,
              sort_order: i,
            }))
          )
        }

        toast.success('Listing submitted for review!')
        router.push('/owner/dashboard')
      } else {
        const { error } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Listing updated!')
        router.push('/owner/dashboard')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save listing')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-warmwhite">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/owner/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
        </Button>
        <h1 className="font-serif font-bold text-lg">
          {mode === 'create' ? 'Add New Listing' : 'Edit Listing'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Property Name *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Mountain View Cottage"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price per Night (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="100"
                  value={form.price_per_night}
                  onChange={e => setForm(f => ({ ...f, price_per_night: e.target.value }))}
                  placeholder="2500"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell guests what makes your property special..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Full Address *</Label>
              <Input
                id="location"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="12, Hill Road, Coonoor"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Ooty"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="Tamil Nadu"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Latitude</Label>
                <Input
                  value={form.lat}
                  onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                  placeholder="11.4102"
                />
              </div>
              <div className="flex-1">
                <Label>Longitude</Label>
                <Input
                  value={form.lng}
                  onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                  placeholder="76.6950"
                />
              </div>
              <Button type="button" variant="outline" onClick={geocodeLocation}>
                <MapPin className="w-4 h-4 mr-1" />Find on Map
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardHeader><CardTitle className="text-base">Capacity & Rooms</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="guests">Max Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="50"
                  value={form.max_guests}
                  onChange={e => setForm(f => ({ ...f, max_guests: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  max="20"
                  value={form.bedrooms}
                  onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  max="20"
                  value={form.bathrooms}
                  onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader><CardTitle className="text-base">Amenities</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.amenities.includes(a)
                      ? 'bg-forest-700 text-white border-forest-700'
                      : 'border-border hover:border-forest-700 hover:text-forest-700'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Photos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-forest-700 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-forest-700 mx-auto animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload photos (max 5MB each)</p>
                  <p className="text-xs text-muted-foreground mt-1">First photo will be the cover image</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {uploadedImages.map((url, i) => (
                  <div key={url} className="relative h-28 rounded-lg overflow-hidden group">
                    <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-forest-700 text-white text-xs px-1.5 py-0.5 rounded">
                        Cover
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-6">
          <Button type="button" variant="outline" className="flex-1" asChild>
            <Link href="/owner/dashboard">Cancel</Link>
          </Button>
          <Button type="submit" className="flex-1 bg-forest-700 hover:bg-forest-800 text-white" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {mode === 'create' ? 'Submit for Review' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
