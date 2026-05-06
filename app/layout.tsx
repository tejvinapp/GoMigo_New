import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'GoMiGooo! — Discover India. Directly.',
    template: '%s | GoMiGooo!',
  },
  description:
    'Book authentic stays, local guides & cabs across India — zero commission, pure experience. Starting with The Nilgiris.',
  keywords: ['India travel', 'Nilgiris', 'Ooty', 'homestay', 'local guide', 'zero commission', 'GoMiGooo'],
  authors: [{ name: 'GoMiGooo!' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'GoMiGooo!',
    title: 'GoMiGooo! — Discover India. Directly.',
    description: 'Zero-commission tourism marketplace for India',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoMiGooo! — Discover India. Directly.',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-warmwhite text-foreground min-h-screen">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
