import type { ReactNode } from 'react'
import Link from 'next/link'

import { LogoutButton } from '@/components/logout-button'

import { getPlacowkaContext } from './actions'

const navItems = [
  { href: '/placowka', label: 'Zamów na dziś' },
  { href: '/placowka/historia', label: 'Historia zamówień' },
  { href: '/placowka/jadlospis', label: 'Jadłospis' },
]

export default async function PlacowkaLayout({
  children,
}: {
  children: ReactNode
}) {
  const context = await getPlacowkaContext()
  const placowkaName = context?.placowkaName ?? 'Placówka'

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      <header className="border-b border-white/10 bg-[#0f1117]/95">
        <div className="flex items-center justify-between px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#22c55e]">
              CateringSystem
            </p>
            <h1 className="mt-1 text-lg font-semibold">{placowkaName}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 px-5 py-6 md:block">
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
        </aside>

        <main className="w-full px-5 py-8 md:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
