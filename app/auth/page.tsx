import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthForm from './auth-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to GoMiGooo! to discover authentic stays, guides & cabs across India.',
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string; next?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data } = await supabase.from('users').select('onboarding_done').eq('id', user.id).single()
    const u = data as { onboarding_done?: boolean } | null
    if (u?.onboarding_done) {
      redirect('/explore')
    } else {
      redirect('/onboarding')
    }
  }

  const params = await searchParams
  return <AuthForm errorCode={params.error} errorMessage={params.msg} next={params.next} />
}
