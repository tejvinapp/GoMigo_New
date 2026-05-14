'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Sign-in failed. Please try again.',
  exchange_failed: 'Could not complete sign-in. Please try again.',
  access_denied: 'You cancelled the sign-in. No worries — try again whenever you like.',
  redirect_uri_mismatch: 'The Google OAuth client is misconfigured. The redirect URI does not match what Google expects.',
  unauthorized_client: 'The Google OAuth client is not allowed to use this redirect URI.',
  invalid_request: 'The sign-in request was malformed.',
  server_error: 'Google had a temporary problem. Please try again in a minute.',
  temporarily_unavailable: 'Google is temporarily down. Please try again in a minute.',
}

export default function AuthForm({
  errorCode,
  errorMessage,
  next,
}: {
  errorCode?: string
  errorMessage?: string
  next?: string
}) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Surface error param as a toast on mount
  useEffect(() => {
    if (errorCode) {
      const friendly = ERROR_MESSAGES[errorCode] ?? errorMessage ?? `Sign-in failed (${errorCode})`
      toast.error(friendly, { duration: 8000 })
    }
  }, [errorCode, errorMessage])

  async function handleGoogleSignIn() {
    setLoading(true)
    const redirectTo = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      toast.error('Sign in failed: ' + error.message)
      setLoading(false)
    }
  }

  const visibleError = errorCode ? (ERROR_MESSAGES[errorCode] ?? errorMessage ?? `Sign-in failed (${errorCode})`) : null

  return (
    <div className="min-h-screen bg-warmwhite flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-forest-700 dark:text-forest-400">GoMiGooo!</h1>
          <p className="text-muted-foreground mt-2 text-sm">Discover India. Directly.</p>
        </div>

        {/* Error banner */}
        {visibleError && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/40 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-medium text-red-700 dark:text-red-300">Couldn&apos;t sign you in</div>
              <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">{visibleError}</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif font-semibold text-foreground">Welcome</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in to explore authentic stays & experiences
            </p>
          </div>

          {/* Hero image */}
          <div className="relative h-40 rounded-xl overflow-hidden mb-6">
            <Image
              src="https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80"
              alt="Nilgiris tea gardens"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3 text-white text-xs font-medium">
              The Nilgiris, Tamil Nadu
            </div>
          </div>

          {/* Benefits */}
          <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
            {[
              '✓ Free to use — no booking fees for travelers',
              '✓ Book direct with verified local hosts',
              '✓ Pay only 20% advance, rest on arrival',
            ].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm rounded-xl font-medium text-base"
            variant="outline"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-gray-300 border-t-forest-700 rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-forest-700 dark:text-forest-400 hover:underline">Terms</Link> &{' '}
            <Link href="/privacy" className="text-forest-700 dark:text-forest-400 hover:underline">Privacy Policy</Link>
          </p>
        </div>

        {/* Vendor CTA */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Are you a property owner, guide or cab driver?{' '}
            <Link href="/become-vendor" className="text-forest-700 dark:text-forest-400 font-medium hover:underline">
              List your business →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
