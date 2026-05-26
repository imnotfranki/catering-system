import { ShoppingList } from '@/components/shopping-list'

import { generateListaZakupow } from './actions'

interface ZakupyPageProps {
  searchParams?: {
    data?: string
  }
}

export default async function ZakupyPage({ searchParams }: ZakupyPageProps) {
  const selectedDate = searchParams?.data ?? new Date().toISOString().slice(0, 10)
  const result = searchParams?.data
    ? await generateListaZakupow(selectedDate)
    : null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Administracja</p>
        <h2 className="mt-2 text-3xl font-semibold">Lista zakupów</h2>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-white/10 bg-[#1a1f2e] p-5 no-print">
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Data
          </span>
          <input
            name="data"
            type="date"
            defaultValue={selectedDate}
            className="rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Generuj
        </button>
      </form>

      <ShoppingList result={result} />
    </div>
  )
}
