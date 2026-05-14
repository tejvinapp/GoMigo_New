import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/explore'

  // OAuth provider returned an error directly (e.g. user cancelled, redirect mismatch)
  const oauthError = searchParams.get('error')
  const oauthErrorDescription = searchParams.get('error_description')
  if (oauthError) {
    const params = new URLSearchParams({ error: oauthError, msg: oauthErrorDescription ?? '' })
    return NextResponse.redirect(`${origin}/auth?${params}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const params = new URLSearchParams({ error: 'exchange_failed', msg: error.message })
      return NextResponse.redirect(`${origin}/auth?${params}`)
    }

    if (!error && data.user) {
      // Check if user has completed onboarding + role-based redirect
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_done, role')
        .eq('id', data.user.id)
        .single()

      const u = userData as { onboarding_done?: boolean; role?: string } | null
      if (!u?.onboarding_done) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // If a specific 'next' was requested, honor it; otherwise default by role
      if (searchParams.get('next')) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      if (u.role === 'admin') return NextResponse.redirect(`${origin}/admin/dashboard`)
      // Everyone else (customer + vendors) lands on /explore — vendors can switch to their dashboard from the menu
      return NextResponse.redirect(`${origin}/explore`)
    }
  }

  // Auth error — redirect back to auth with error indicator
  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
