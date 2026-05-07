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
      // Check if user has completed onboarding
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_done')
        .eq('id', data.user.id)
        .single()

      if (!userData?.onboarding_done) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect back to auth with error indicator
  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
