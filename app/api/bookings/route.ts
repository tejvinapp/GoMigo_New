import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookingSchema } from '@/lib/validations/booking'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = bookingSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 })
  }

  const { property_id, check_in, check_out, guests, special_requests } = result.data

  // Get property for price calculation
  const { data: property } = await supabase
    .from('properties')
    .select('id, price_per_night, max_guests, status, owner_id')
    .eq('id', property_id)
    .eq('status', 'active')
    .single()

  if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  if (property.owner_id === user.id) return NextResponse.json({ error: 'You cannot book your own property' }, { status: 400 })
  if (guests > property.max_guests) return NextResponse.json({ error: `Max ${property.max_guests} guests allowed` }, { status: 400 })

  // Check for conflicting bookings
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('property_id', property_id)
    .not('status', 'in', '(cancelled,refunded)')
    .lt('check_in', check_out)
    .gt('check_out', check_in)

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: 'Property not available for these dates' }, { status: 409 })
  }

  const checkInDate = new Date(check_in)
  const checkOutDate = new Date(check_out)
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalAmount = nights * property.price_per_night

  const { data: booking, error } = await supabase.from('bookings').insert({
    property_id,
    customer_id: user.id,
    check_in,
    check_out,
    guests,
    total_amount: totalAmount,
    special_requests,
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })

  return NextResponse.json(booking)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, property:property_id(title, city, cover_image, phone)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(bookings ?? [])
}
