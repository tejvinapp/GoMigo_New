import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = await request.json()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
    return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
  }

  // Get Razorpay secret
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['razorpay_key_secret'])

  const keySecret = process.env.RAZORPAY_KEY_SECRET || settings?.[0]?.value || ''

  if (!keySecret) {
    return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 })
  }

  // Verify HMAC signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSignature = createHmac('sha256', keySecret).update(body).digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  // Verify booking belongs to this user
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id, total_amount, advance_paid')
    .eq('id', booking_id)
    .eq('customer_id', user.id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Get payment amount from Razorpay
  const { data: settingsAll } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['razorpay_key_id', 'razorpay_key_secret'])

  const s = Object.fromEntries((settingsAll ?? []).map(x => [x.key, x.value ?? '']))
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || s.razorpay_key_id

  let paidAmount = 0
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    })
    const payment = await paymentRes.json()
    paidAmount = payment.amount / 100 // convert from paise
  } catch {}

  // Mark booking as advance_paid
  await supabase.from('bookings').update({
    status: 'advance_paid',
    advance_paid: paidAmount || booking.advance_paid,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }).eq('id', booking_id)

  // Create notification for property owner
  try {
    const { data: property } = await supabase
      .from('bookings')
      .select('property:property_id(owner_id, title)')
      .eq('id', booking_id)
      .single() as { data: { property: { owner_id: string; title: string } } | null }

    if (property?.property?.owner_id) {
      await supabase.from('notifications').insert({
        user_id: property.property.owner_id,
        title: 'New Booking Received!',
        body: `A guest has paid the advance for your property.`,
        type: 'booking',
        link: '/owner/dashboard',
      })
    }
  } catch {}

  return NextResponse.json({ success: true })
}
