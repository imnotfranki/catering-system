import Link from 'next/link'

import { createSupabaseAdminClient } from '@/lib/supabase-admin'

const statCards = [
  { key: 'activePlacowki', label: 'Aktywne placówki' },
  { key: 'todayOrders', label: 'Zamówienia dziś' },
  { key: 'orderedToday', label: 'Placówki z zamówieniem dziś' },
  { key: 'notOrderedToday', label: 'Placówki bez zamówienia dziś' },
] as const

const navCards = [
  { href: '/admin/placowki', label: 'Zarządzaj placówkami' },
  { href: '/admin/jadlospisy', label: 'Jadłospisy' },
  { href: '/admin/zamowienia', label: 'Zamówienia dziś' },
]

export default async function AdminPage() {
  const supabase = createSupabaseAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [
    activePlacowkiResult,
    todayOrdersResult,
    orderedPlacowkiResult,
    activePlacowkiListResult,
  ] = await Promise.all([
    supabase
      .from('placowki')
      .select('id', { count: 'exact', head: true })
      .eq('aktywna', true),
    supabase
      .from('zamowienia')
      .select('id', { count: 'exact', head: true })
      .eq('data', today),
    supabase
      .from('zamowienia')
      .select('placowka_id')
      .eq('data', today),
    supabase
      .from('placowki')
      .select('id, nazwa')
      .eq('aktywna', true)
      .order('nazwa', { ascending: true }),
  ])

  const activePlacowki = activePlacowkiResult.count ?? 0
  const todayOrders = todayOrdersResult.count ?? 0
  const orderedToday = new Set(
    (orderedPlacowkiResult.data ?? [])
      .map((order) => order.placowka_id)
      .filter(Boolean),
  ).size
  const notOrderedToday = Math.max(activePlacowki - orderedToday, 0)
  const orderedIds = new Set(
    (orderedPlacowkiResult.data ?? [])
      .map((order) => order.placowka_id)
      .filter(Boolean),
  )
  const missingPlacowki = (activePlacowkiListResult.data ?? []).filter(
    (placowka) => !orderedIds.has(placowka.id),
  )

  const stats = {
    activePlacowki,
    todayOrders,
    orderedToday,
    notOrderedToday,
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold">Panel Administratora</h2>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">
              {stats[card.key]}
            </p>
            {card.key === 'notOrderedToday' ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {missingPlacowki.length ? (
                  missingPlacowki.map((placowka) => (
                    <span
                      key={placowka.id}
                      className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-200"
                    >
                      {placowka.nazwa}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">brak</span>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5 font-medium text-slate-100 transition hover:border-[#22c55e] hover:text-[#22c55e]"
          >
            {card.label}
          </Link>
        ))}
      </section>
    </div>
  )
}
