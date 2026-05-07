import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()

  // Get Resend settings
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['resend_api_key', 'resend_from_email', 'resend_from_name'])

  const s = Object.fromEntries((settings ?? []).map(x => [x.key, x.value ?? '']))
  const apiKey = process.env.RESEND_API_KEY || s.resend_api_key
  const fromEmail = s.resend_from_email || 'noreply@gomigoo.in'
  const fromName = s.resend_from_name || 'GoMiGooo!'

  if (!apiKey) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  try {
    if (body.type === 'test') {
      const adminEmail = user?.email
      if (!adminEmail) return NextResponse.json({ error: 'No email' }, { status: 400 })

      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: adminEmail,
        subject: 'GoMiGooo! Email Test',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px;">
            <h2 style="color: #1a6b3c;">✅ Email is working!</h2>
            <p>Your GoMiGooo! email settings are configured correctly.</p>
            <p>Booking confirmations, owner notifications, and subscription emails will be sent from <strong>${fromEmail}</strong>.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">GoMiGooo! — Discover India. Directly.</p>
          </div>
        `,
      })
      return NextResponse.json({ success: true })
    }

    if (body.type === 'booking_confirmation') {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: body.customer_email,
        subject: `Booking Confirmed — ${body.property_title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px;">
            <h2 style="color: #1a6b3c;">🎉 Your booking is confirmed!</h2>
            <p>Hi ${body.customer_name},</p>
            <p>Your advance payment for <strong>${body.property_title}</strong> has been received.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Check-in</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${body.check_in}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Check-out</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${body.check_out}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Guests</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${body.guests}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Advance Paid</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #1a6b3c;">₹${body.advance_paid}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Balance Due on Arrival</td><td style="padding: 8px; font-weight: bold;">₹${body.balance_due}</td></tr>
            </table>
            <p>The property owner will contact you to confirm. You can also call them directly.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">GoMiGooo! — Zero commission, pure experience</p>
          </div>
        `,
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Email sending failed' }, { status: 500 })
  }
}
