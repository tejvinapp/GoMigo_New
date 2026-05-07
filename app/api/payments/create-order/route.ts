import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { booking_id, amount } = await request.json()

  if (!booking_id || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify booking belongs to this user
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id, status')
    .eq('id', booking_id)
    .eq('customer_id', user.id)
    .single()

  if (!booking || booking.status !== 'pending') {
    return NextResponse.json({ error: 'Booking not found or already processed' }, { status: 400 })
  }

  // Get Razorpay keys from platform_settings (server-side only)
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['razorpay_key_id', 'razorpay_key_secret'])

  const s = Object.fromEntries((settings ?? []).map(s => [s.key, s.value ?? '']))
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || s.razorpay_key_id
  const keySecret = process.env.RAZORPAY_KEY_SECRET || s.razorpay_key_secret

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Payment not configured. Please contact support.' }, { status: 500 })
  }

  try {
    // Create Razorpay order using REST API (avoids SDK dependency issues)
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: booking_id.slice(0, 40),
        notes: { booking_id },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.description ?? 'Razorpay error' }, { status: 500 })
    }

    const order = await res.json()

    // Update booking with razorpay_order_id
    await supabase.from('bookings').update({ razorpay_order_id: order.id }).eq('id', booking_id)

    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency })
  } catch {
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
