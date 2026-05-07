import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthForm from './auth-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to GoMiGooo! to discover authentic stays, guides & cabs across India.',
}

export default async function AuthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data } = await supabase.from('users').select('onboarding_done').eq('id', user.id).single()
    if (data?.onboarding_done) {
      redirect('/explore')
    } else {
      redirect('/onboarding')
    }
  }

  return <AuthForm />
}
