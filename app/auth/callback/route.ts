import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/explore'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

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

      // If a specific 'next' was requested, honor it; otherwise route by role
      if (searchParams.get('next')) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      if (u.role === 'admin') return NextResponse.redirect(`${origin}/admin/dashboard`)
      if (u.role === 'customer') return NextResponse.redirect(`${origin}/explore`)
      return NextResponse.redirect(`${origin}/owner/dashboard`)
    }
  }

  // Auth error — redirect back to auth with error indicator
  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
