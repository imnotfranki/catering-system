import Link from 'next/link'

import { AdminOrders } from '@/components/admin-orders'

import {
  getActivePlacowki,
  getPlacowkiBezZamowienia,
  getZamowieniaByDate,
} from './actions'

interface ZamowieniaPageProps {
  searchParams?: {
    data?: string
  }
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export default async function ZamowieniaPage({
  searchParams,
}: ZamowieniaPageProps) {
  const selectedDate = searchParams?.data ?? new Date().toISOString().slice(0, 10)
  const [orders, placowki, missingPlacowki] = await Promise.all([
    getZamowieniaByDate(selectedDate),
    getActivePlacowki(),
    getPlacowkiBezZamowienia(selectedDate),
  ])
  const totalNormal = orders.reduce(
    (sum, order) => sum + order.ilosc_normalnych,
    0,
  )
  const totalDiets = orders.reduce(
    (sum, order) =>
      sum + order.diety.reduce((dietSum, dieta) => dietSum + dieta.ilosc, 0),
    0,
  )
  const orderedPlacowki = new Set(orders.map((order) => order.placowka_id)).size

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-[#22c55e]">Raport dzienny</p>
          <h2 className="mt-2 text-3xl font-semibold">
            Zamówienia — {selectedDate}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/zamowienia?data=${shiftDate(selectedDate, -1)}`}
            className="rounded-md border border-white/10 px-4 py-3 text-sm"
          >
            ←
          </Link>
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="data"
              defaultValue={selectedDate}
              className="rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white"
            />
            <button
              type="submit"
              className="rounded-md bg-[#22c55e] px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Pokaż
            </button>
          </form>
          <Link
            href={`/admin/zamowienia?data=${shiftDate(selectedDate, 1)}`}
            className="rounded-md border border-white/10 px-4 py-3 text-sm"
          >
            →
          </Link>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
          <p className="text-sm text-slate-400">Łącznie porcji normalnych</p>
          <p className="mt-3 text-4xl font-semibold">{totalNormal}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
          <p className="text-sm text-slate-400">Łącznie diet</p>
          <p className="mt-3 text-4xl font-semibold">{totalDiets}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
          <p className="text-sm text-slate-400">Placówki z zamówieniem</p>
          <p className="mt-3 text-4xl font-semibold">
            {orderedPlacowki} / {placowki.length}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
          <p className="text-sm text-slate-400">Placówki bez zamówienia</p>
          <div className="mt-3 flex flex-wrap gap-2">
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
        </div>
      </section>

      <AdminOrders date={selectedDate} orders={orders} placowki={placowki} />
    </div>
  )
}
