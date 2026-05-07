// Haversine formula — distance between two lat/lng points in km
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

// Cache for geocoding results (avoids hitting Nominatim rate limit)
const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

// Geocode a city name → lat/lng using Nominatim (OpenStreetMap, free)
export async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const key = city.toLowerCase().trim()
  if (geocodeCache.has(key)) return geocodeCache.get(key)!

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { headers: { 'User-Agent': 'GoMiGooo/1.0 (tejvin1617@gmail.com)' } }
    )
    const data = await res.json()
    if (data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geocodeCache.set(key, result)
      return result
    }
  } catch {}

  geocodeCache.set(key, null)
  return null
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 10) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}

// Fetch nearby attractions from OpenStreetMap Overpass API (free, no key)
export async function fetchNearbyAttractions(
  lat: number,
  lng: number,
  radiusMeters = 5000
): Promise<Array<{ name: string; type: string; lat: number; lng: number }>> {
  const query = `
    [out:json][timeout:10];
    (
      node["tourism"~"attraction|viewpoint|museum|hotel"](around:${radiusMeters},${lat},${lng});
      node["natural"~"peak|waterfall|lake"](around:${radiusMeters},${lat},${lng});
      node["amenity"~"restaurant|cafe"](around:${radiusMeters},${lat},${lng});
    );
    out body 15;
  `
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    })
    const data = await res.json()
    return (data.elements || [])
      .filter((el: { tags?: { name?: string }; lat: number; lon: number }) => el.tags?.name)
      .map((el: { tags: { name: string; tourism?: string; natural?: string; amenity?: string }; lat: number; lon: number }) => ({
        name: el.tags.name,
        type: el.tags.tourism || el.tags.natural || el.tags.amenity || 'place',
        lat: el.lat,
        lng: el.lon,
      }))
  } catch {
    return []
  }
}
