'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { KitchenOrder } from '@/app/kuchnia/actions'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { StatusZamowienia, TypPosilku } from '@/types'

const meals: { key: TypPosilku; label: string }[] = [
  { key: 'sniadanie', label: 'Śniadanie' },
  { key: 'obiad', label: 'Obiad' },
  { key: 'podwieczorek', label: 'Podwieczorek' },
]

const statusLabels: Record<StatusZamowienia, string> = {
  oczekujace: 'oczekujące',
  w_realizacji: 'w realizacji',
  gotowe: 'gotowe',
  dostarczone: 'dostarczone',
}

const statusClasses: Record<StatusZamowienia, string> = {
  oczekujace: 'bg-slate-700 text-slate-100',
  w_realizacji: 'bg-yellow-400 text-slate-950',
  gotowe: 'bg-[#22c55e] text-slate-950',
  dostarczone: 'bg-emerald-800 text-emerald-50',
}

function nextStatus(status: StatusZamowienia): StatusZamowienia {
  if (status === 'oczekujace') {
    return 'w_realizacji'
  }

  if (status === 'w_realizacji') {
    return 'gotowe'
  }

  return 'oczekujace'
}

interface KitchenMonitorProps {
  initialOrders: KitchenOrder[]
}

type RawKitchenOrder = {
  id: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: { nazwa: string; ilosc: number }[] | null
  status: StatusZamowienia
  placowki?: { nazwa?: string } | { nazwa?: string }[] | null
}

export function KitchenMonitor({ initialOrders }: KitchenMonitorProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [clock, setClock] = useState(new Date())
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const fetchOrders = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('zamowienia')
      .select('id, posilek, ilosc_normalnych, diety, status, placowki(nazwa)')
      .eq('data', today)
      .order('posilek', { ascending: true })
      .order('utworzone_o', { ascending: true })

    setOrders(
      ((data ?? []) as RawKitchenOrder[]).map((order) => {
        const placowki = Array.isArray(order.placowki)
          ? order.placowki[0]
          : order.placowki

        return {
          id: order.id,
          posilek: order.posilek,
          ilosc_normalnych: order.ilosc_normalnych,
          diety: order.diety ?? [],
          status: order.status,
          placowka_nazwa: placowki?.nazwa ?? 'Placówka',
        }
      }),
    )
  }, [supabase])

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('zamowienia')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zamowienia' },
        () => {
          void fetchOrders()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchOrders, supabase])

  async function updateStatus(order: KitchenOrder) {
    const status = nextStatus(order.status)

    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status } : item)),
    )

    const { error } = await supabase
      .from('zamowienia')
      .update({ status })
      .eq('id', order.id)

    if (error) {
      await fetchOrders()
    }
  }

  const dateLabel = new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'full',
  }).format(clock)
  const timeLabel = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(clock)

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#0f1117] p-5 text-slate-100 lg:p-8">
      <header className="mb-8 flex flex-col justify-between gap-3 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#22c55e]">
            Monitor
          </p>
          <h1 className="mt-2 text-3xl font-bold lg:text-5xl">
            Kuchnia — {dateLabel}
          </h1>
        </div>
        <p className="text-4xl font-bold text-[#22c55e] lg:text-6xl">
          {timeLabel}
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-3">
        {meals.map((meal) => {
          const mealOrders = orders.filter((order) => order.posilek === meal.key)
          const normalTotal = mealOrders.reduce(
            (sum, order) => sum + order.ilosc_normalnych,
            0,
          )
          const dietTotals = new Map<string, number>()

          mealOrders.forEach((order) => {
            order.diety.forEach((dieta) => {
              dietTotals.set(
                dieta.nazwa,
                (dietTotals.get(dieta.nazwa) ?? 0) + dieta.ilosc,
              )
            })
          })

          return (
            <section
              key={meal.key}
              className="flex min-h-[620px] flex-col rounded-lg border border-white/10 bg-[#1a1f2e]"
            >
              <div className="border-b border-white/10 p-5">
                <h2 className="text-3xl font-bold">{meal.label}</h2>
                <p className="mt-3 text-5xl font-black text-[#22c55e]">
                  {normalTotal} porcji
                </p>
              </div>

              <div className="flex-1 space-y-4 p-5">
                {mealOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-lg border border-white/10 bg-[#0f1117] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-bold">{order.placowka_nazwa}</h3>
                      <button
                        type="button"
                        onClick={() => void updateStatus(order)}
                        className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${statusClasses[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </button>
                    </div>
                    <p className="mt-4 text-xl">
                      Porcje normalne:{' '}
                      <span className="font-bold text-white">
                        {order.ilosc_normalnych}
                      </span>
                    </p>
                    <div className="mt-4">
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Diety
                      </p>
                      {order.diety.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-lg">
                          {order.diety.map((dieta, index) => (
                            <li key={`${dieta.nazwa}-${index}`}>
                              {dieta.ilosc}x {dieta.nazwa}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-lg text-slate-500">brak</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <footer className="border-t border-white/10 p-5">
                <p className="text-xl font-bold">
                  SUMA normalnych: <span className="text-[#22c55e]">{normalTotal}</span>
                </p>
                <div className="mt-3 space-y-1 text-lg">
                  {Array.from(dietTotals.entries()).length > 0 ? (
                    Array.from(dietTotals.entries()).map(([name, count]) => (
                      <p key={name}>
                        {count}x {name}
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-500">Brak diet</p>
                  )}
                </div>
              </footer>
            </section>
          )
        })}
      </div>
    </div>
  )
}
