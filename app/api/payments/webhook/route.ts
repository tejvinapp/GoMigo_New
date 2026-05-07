import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  const supabase = await createAdminClient()

  // Get webhook secret
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'razorpay_webhook_secret')
    .single()

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || settings?.value || ''

  if (secret) {
    const expectedSig = createHmac('sha256', secret).update(body).digest('hex')
    if (expectedSig !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  const event = JSON.parse(body)

  if (event.event === 'subscription.activated') {
    const sub = event.payload.subscription.entity
    await supabase.from('subscriptions').update({
      status: 'active',
      current_period_end: new Date(sub.current_end * 1000).toISOString(),
    }).eq('razorpay_subscription_id', sub.id)
  }

  if (event.event === 'subscription.charged') {
    const sub = event.payload.subscription.entity
    await supabase.from('subscriptions').update({
      status: 'active',
      current_period_end: new Date(sub.current_end * 1000).toISOString(),
    }).eq('razorpay_subscription_id', sub.id)
  }

  if (event.event === 'subscription.cancelled' || event.event === 'subscription.completed') {
    const sub = event.payload.subscription.entity
    await supabase.from('subscriptions').update({ status: 'cancelled' })
      .eq('razorpay_subscription_id', sub.id)
  }

  if (event.event === 'subscription.pending') {
    const sub = event.payload.subscription.entity
    await supabase.from('subscriptions').update({ status: 'past_due' })
      .eq('razorpay_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
