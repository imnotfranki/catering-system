import type { ReactNode } from 'react'
import Link from 'next/link'

import { LogoutButton } from '@/components/logout-button'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/placowki', label: 'Placówki' },
  { href: '/admin/jadlospisy', label: 'Jadłospisy' },
  { href: '/admin/zamowienia', label: 'Zamówienia' },
  { href: '/admin/zakupy', label: 'Lista zakupów' },
  { href: '/admin/uzytkownicy', label: 'Użytkownicy' },
  { href: '/admin/ustawienia', label: 'Ustawienia' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      <header className="border-b border-white/10 bg-[#0f1117]/95 md:hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#22c55e]">
              CateringSystem
            </p>
            <h1 className="mt-1 text-lg font-semibold">Administrator</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0f1117] px-5 py-6 md:block">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#22c55e]">
              CateringSystem
            </p>
            <h1 className="mt-2 text-xl font-semibold">Administrator</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-[#1a1f2e] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-5">
            <LogoutButton />
          </div>
        </aside>

        <main className="w-full px-5 py-8 md:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
