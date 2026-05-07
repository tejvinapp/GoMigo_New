'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Settings, Users, CreditCard, ImageIcon, FileCheck,
  Activity, LogOut, ChevronDown, Menu, X, ExternalLink
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useSupabase } from '@/components/providers'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/photos', label: 'Photos', icon: ImageIcon },
  { href: '/admin/kyc', label: 'KYC', icon: FileCheck },
  { href: '/admin/logs', label: 'Activity', icon: Activity },
]

export default function AdminHeader({
  name, email, avatarUrl,
}: { name: string | null; email: string; avatarUrl: string | null }) {
  const { supabase } = useSupabase()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: logo + mobile toggle */}
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-forest-700">GoMiGooo!</span>
            <span className="text-xs px-2 py-0.5 rounded bg-forest-50 text-forest-700 font-medium hidden sm:inline">ADMIN</span>
          </Link>
        </div>

        {/* Center: desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(item => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-forest-50 text-forest-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: theme toggle + user menu */}
        <div className="flex items-center gap-1">
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl ?? ''} />
              <AvatarFallback className="bg-forest-100 text-forest-700 text-xs">
                {name?.[0] ?? email[0]?.toUpperCase() ?? 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium max-w-32 truncate">{name ?? 'Admin'}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-border">
                  <div className="font-medium text-sm">{name ?? 'Admin'}</div>
                  <div className="text-xs text-muted-foreground truncate">{email}</div>
                </div>
                <div className="p-1">
                  <Link
                    href="/explore"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit public site
                  </Link>
                  <Link
                    href="/customer/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Users className="w-4 h-4" />
                    My profile
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-2 py-2 grid grid-cols-2 gap-1">
            {NAV.map(item => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? 'bg-forest-50 text-forest-700' : 'text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
