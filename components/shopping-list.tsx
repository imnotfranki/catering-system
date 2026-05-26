'use client'

import { useMemo } from 'react'

import type { ListaZakupow, SkladnikZakupowy } from '@/app/admin/zakupy/actions'

const mealLabels: Record<string, string> = {
  sniadanie: 'Śniadanie',
  obiad: 'Obiad',
  podwieczorek: 'Podwieczorek',
}

interface ShoppingListProps {
  result: ListaZakupow | null
}

export function ShoppingList({ result }: ShoppingListProps) {
  const totals = useMemo(() => {
    const grouped = new Map<string, SkladnikZakupowy[]>()

    ;(result?.skladniki ?? []).forEach((item) => {
      grouped.set(item.nazwa, [...(grouped.get(item.nazwa) ?? []), item])
    })

    return Array.from(grouped.entries())
      .filter(([, items]) => items.length > 1)
      .map(([name, items]) => ({
        nazwa: name,
        ilosc_g: items.reduce((sum, item) => sum + item.ilosc_g, 0),
      }))
  }, [result?.skladniki])

  if (!result) {
    return null
  }

  if (result.blad) {
    return (
      <p className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-100">
        {result.blad}
      </p>
    )
  }

  function exportCsv() {
    if (!result) {
      return
    }

    const rows = [
      ['Składnik', 'Posiłek', 'Ilość (g)', 'Ilość (kg)'],
      ...result.skladniki.map((item) => [
        item.nazwa,
        mealLabels[item.posilek] ?? item.posilek,
        item.ilosc_g.toFixed(0),
        item.ilosc_kg.toFixed(2),
      ]),
      ...totals.map((item) => [
        item.nazwa,
        'SUMA',
        item.ilosc_g.toFixed(0),
        (item.ilosc_g / 1000).toFixed(2),
      ]),
    ]
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lista_zakupow_${result.data}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="print-header hidden">
        <h1>CateringSystem</h1>
        <p>Lista zakupów — {result.data}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3 no-print">
        <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
          <p className="text-sm text-slate-400">Data</p>
          <p className="mt-2 text-2xl font-semibold">{result.data}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
          <p className="text-sm text-slate-400">Placówki z zamówieniem</p>
          <p className="mt-2 text-2xl font-semibold">{result.liczba_placowek}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
          <p className="text-sm text-slate-400">Łączna liczba porcji</p>
          <p className="mt-2 text-2xl font-semibold">{result.lacznie_porcji}</p>
        </div>
      </section>

      <div className="flex gap-3 no-print">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Drukuj
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100"
        >
          Eksportuj CSV
        </button>
      </div>

      <section className="print-area overflow-hidden rounded-lg border border-white/10 bg-[#1a1f2e]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4">Składnik</th>
                <th className="px-5 py-4">Ilość (g)</th>
                <th className="px-5 py-4">Ilość (kg)</th>
                <th className="px-5 py-4">Posiłek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {result.skladniki.map((item) => (
                <tr key={`${item.nazwa}-${item.posilek}`}>
                  <td className="px-5 py-4 text-slate-100">{item.nazwa}</td>
                  <td className="px-5 py-4 text-slate-100">
                    {item.ilosc_g.toFixed(0)}
                  </td>
                  <td className="px-5 py-4 text-slate-100">
                    {item.ilosc_kg.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-slate-100">
                    {mealLabels[item.posilek] ?? item.posilek}
                  </td>
                </tr>
              ))}
              {totals.map((item) => (
                <tr key={`total-${item.nazwa}`} className="bg-[#22c55e]/10 font-bold">
                  <td className="px-5 py-4 text-[#22c55e]">{item.nazwa} SUMA</td>
                  <td className="px-5 py-4 text-[#22c55e]">
                    {item.ilosc_g.toFixed(0)}
                  </td>
                  <td className="px-5 py-4 text-[#22c55e]">
                    {(item.ilosc_g / 1000).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-[#22c55e]">SUMA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {result.bez_gramatur.length > 0 ? (
        <section className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 no-print">
          <h3 className="text-xl font-semibold text-red-100">Brak gramatur</h3>
          <p className="mt-2 text-sm text-red-100">
            Poniższe dania nie mają przepisów — dodaj składniki ręcznie
          </p>
          <ul className="mt-4 space-y-2 text-sm text-red-50">
            {result.bez_gramatur.map((item) => (
              <li key={`${item.posilek}-${item.opis}`}>
                {mealLabels[item.posilek] ?? item.posilek}: {item.opis}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
