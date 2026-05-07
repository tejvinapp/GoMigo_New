import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { Metadata } from 'next'

const VALID_SLUGS = ['about', 'contact', 'terms', 'privacy', 'cookies', 'refund', 'press'] as const
type Slug = typeof VALID_SLUGS[number]

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (!VALID_SLUGS.includes(slug as Slug)) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', `page_${slug}_title`)
    .single()
  const title = (data as { value?: string } | null)?.value ?? slug
  return { title }
}

// Lightweight markdown -> HTML (h2, lists, bold, paragraphs)
function renderMarkdown(text: string): string {
  if (!text) return ''
  const lines = text.split('\n')
  const out: string[] = []
  let inList = false
  for (let line of lines) {
    line = line.trimEnd()
    if (line.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h2 class="font-serif text-2xl font-bold mt-8 mb-3">${line.slice(3)}</h2>`)
    } else if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul class="list-disc pl-6 space-y-1 my-3">'); inList = true }
      out.push(`<li>${formatInline(line.slice(2))}</li>`)
    } else if (line === '') {
      if (inList) { out.push('</ul>'); inList = false }
    } else {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<p class="my-3 leading-relaxed">${formatInline(line)}</p>`)
    }
  }
  if (inList) out.push('</ul>')
  return out.join('\n')
}

function formatInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline text-forest-700 dark:text-forest-400">$1</a>')
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!VALID_SLUGS.includes(slug as Slug)) notFound()

  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', [`page_${slug}_title`, `page_${slug}_body`])

  const map = Object.fromEntries(((settings ?? []) as { key: string; value: string }[]).map(s => [s.key, s.value]))
  const title = map[`page_${slug}_title`] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
  const body = map[`page_${slug}_body`] ?? 'Coming soon.'

  return (
    <div className="min-h-screen bg-warmwhite text-foreground">
      {/* Top nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/"><ArrowLeft className="w-4 h-4 mr-1" />Home</Link>
            </Button>
            <Link href="/" className="font-serif text-lg font-bold text-forest-700 dark:text-forest-400">GoMiGooo!</Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">{title}</h1>
        <article
          className="text-foreground/90 leading-relaxed prose-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
        />
        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
