import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import LandingClient from './landing-client'

export const metadata: Metadata = {
  title: 'GoMiGooo! — Discover India. Directly.',
  description: 'Zero-commission tourism marketplace for India. Book authentic stays, guides & cabs in The Nilgiris, Ooty, Kodaikanal, Munnar & Coorg.',
}

export default async function LandingPage() {
  // Fetch settings and destinations on server
  let settings: Record<string, string> = {}
  let destinations = []

  try {
    const supabase = await createClient()

    const { data: settingsData } = await supabase
      .from('platform_settings')
      .select('key, value')
      .eq('sensitive', false)

    if (settingsData) {
      settings = Object.fromEntries(settingsData.map(s => [s.key, s.value ?? '']))
    }

    const { data: destinationsData } = await supabase
      .from('destinations')
      .select('*')
      .order('is_featured', { ascending: false })
      .limit(6)

    destinations = destinationsData ?? []
  } catch {
    // Supabase not configured yet — use defaults
  }

  return <LandingClient settings={settings} destinations={destinations} />
}
