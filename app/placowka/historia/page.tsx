import Link from 'next/link'

import { getOrderHistory } from '../actions'

const mealLabels: Record<string, string> = {
  sniadanie: 'Śniadanie',
  obiad: 'Obiad',
  podwieczorek: 'Podwieczorek',
}

function getMonthOptions() {
  const now = new Date()

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const value = date.toISOString().slice(0, 7)
    const label = new Intl.DateTimeFormat('pl-PL', {
      month: 'long',
      year: 'numeric',
    }).format(date)

    return { value, label }
  })
}

function formatDiets(diety: unknown) {
  if (!Array.isArray(diety) || diety.length === 0) {
    return 'brak'
  }

  return diety
    .map((dieta) => {
      if (
        typeof dieta === 'object' &&
        dieta !== null &&
        'ilosc' in dieta &&
        'nazwa' in dieta
      ) {
        return `${dieta.ilosc}x ${dieta.nazwa}`
      }

      return null
    })
    .filter(Boolean)
    .join(', ')
}

interface HistoriaPageProps {
  searchParams?: {
    month?: string
    page?: string
  }
}

export default async function HistoriaPage({ searchParams }: HistoriaPageProps) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const month = searchParams?.month ?? currentMonth
  const page = Math.max(Number(searchParams?.page ?? 1), 1)
  const { orders, count } = await getOrderHistory(month, page)
  const totalPages = Math.max(Math.ceil(count / 20), 1)
  const monthOptions = getMonthOptions()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Historia</p>
        <h2 className="mt-2 text-3xl font-semibold">Historia zamówień</h2>
      </div>

      <form className="rounded-lg border border-white/10 bg-[#1a1f2e] p-4">
        <label className="block max-w-xs">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Miesiąc
          </span>
          <select
            name="month"
            defaultValue={month}
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="mt-4 rounded-md bg-[#22c55e] px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Filtruj
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1f2e]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Posiłek</th>
                <th className="px-5 py-4">Porcje normalne</th>
                <th className="px-5 py-4">Diety</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-5 py-4 text-slate-200">{order.data}</td>
                  <td className="px-5 py-4 text-slate-200">
                    {mealLabels[order.posilek] ?? order.posilek}
                  </td>
                  <td className="px-5 py-4 text-slate-200">
                    {order.ilosc_normalnych}
                  </td>
                  <td className="px-5 py-4 text-slate-200">
                    {formatDiets(order.diety)}
                  </td>
                  <td className="px-5 py-4 text-[#22c55e]">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-300">
        <Link
          href={`/placowka/historia?month=${month}&page=${Math.max(page - 1, 1)}`}
          className="rounded-md border border-white/10 px-4 py-2"
        >
          Poprzednia
        </Link>
        <span>
          Strona {page} z {totalPages}
        </span>
        <Link
          href={`/placowka/historia?month=${month}&page=${Math.min(page + 1, totalPages)}`}
          className="rounded-md border border-white/10 px-4 py-2"
        >
          Następna
        </Link>
      </div>
    </div>
  )
}
