'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'

import {
  createZamowienieReczne,
  type AdminZamowienie,
  type Dieta,
  type SelectPlacowka,
  updateZamowienie,
} from '@/app/admin/zamowienia/actions'
import type { StatusZamowienia, TypPosilku } from '@/types'

const meals: { key: TypPosilku; label: string }[] = [
  { key: 'sniadanie', label: 'Śniadanie' },
  { key: 'obiad', label: 'Obiad' },
  { key: 'podwieczorek', label: 'Podwieczorek' },
]

const statuses: StatusZamowienia[] = [
  'oczekujace',
  'w_realizacji',
  'gotowe',
  'dostarczone',
]

function dietsText(diety: Dieta[]) {
  return diety.length
    ? diety.map((dieta) => `${dieta.ilosc}x ${dieta.nazwa}`).join(', ')
    : 'brak'
}

function dietTotal(diety: Dieta[]) {
  return diety.reduce((sum, dieta) => sum + dieta.ilosc, 0)
}

const deliveryClasses: Record<string, string> = {
  oczekuje: 'bg-slate-700 text-slate-100',
  w_drodze: 'bg-yellow-400 text-slate-950',
  dostarczone: 'bg-[#22c55e] text-slate-950',
}

const deliveryLabels: Record<string, string> = {
  oczekuje: 'oczekuje',
  w_drodze: 'w drodze',
  dostarczone: 'dostarczone',
}

interface AdminOrdersProps {
  date: string
  orders: AdminZamowienie[]
  placowki: SelectPlacowka[]
}

export function AdminOrders({ date, orders, placowki }: AdminOrdersProps) {
  const [rows, setRows] = useState(orders)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const grouped = useMemo(() => {
    return Object.fromEntries(
      meals.map((meal) => [
        meal.key,
        rows.filter((row) => row.posilek === meal.key),
      ]),
    ) as Record<TypPosilku, AdminZamowienie[]>
  }, [rows])

  function updateRow(id: string, patch: Partial<AdminZamowienie>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )
    setDirtyIds((current) => new Set(current).add(id))
  }

  function saveRow(row: AdminZamowienie) {
    startTransition(async () => {
      await updateZamowienie(
        row.id,
        row.ilosc_normalnych,
        row.diety,
        row.status,
      )
      setDirtyIds((current) => {
        const next = new Set(current)
        next.delete(row.id)
        return next
      })
    })
  }

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        Dodaj zamówienie ręcznie
      </button>

      {meals.map((meal) => {
        const mealRows = grouped[meal.key]
        const normalTotal = mealRows.reduce(
          (sum, row) => sum + row.ilosc_normalnych,
          0,
        )
        const dietsTotal = mealRows.reduce(
          (sum, row) => sum + dietTotal(row.diety),
          0,
        )

        return (
          <section
            key={meal.key}
            className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1f2e]"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-2xl font-semibold">{meal.label}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Placówka</th>
                    <th className="px-5 py-4">Porcje normalne</th>
                    <th className="px-5 py-4">Diety</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Dostawa</th>
                    <th className="px-5 py-4">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {mealRows.map((row) => {
                    const isDirty = dirtyIds.has(row.id)

                    return (
                      <tr
                        key={row.id}
                        className={isDirty ? 'bg-yellow-400/10' : undefined}
                      >
                        <td className="px-5 py-4 font-medium text-white">
                          {row.placowka_nazwa}
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min={0}
                            value={row.ilosc_normalnych}
                            onChange={(event) =>
                              updateRow(row.id, {
                                ilosc_normalnych: Number(event.target.value),
                              })
                            }
                            className="w-28 rounded-md border border-white/10 bg-[#0f1117] px-3 py-2 text-white outline-none focus:border-[#22c55e]"
                          />
                        </td>
                        <td className="px-5 py-4 text-slate-200">
                          <div className="max-w-sm">{dietsText(row.diety)}</div>
                          <Link
                            href={`/admin/zamowienia/${row.id}/diety`}
                            className="mt-2 inline-block text-xs font-medium text-[#22c55e]"
                          >
                            Edytuj diety
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={row.status}
                            onChange={(event) =>
                              updateRow(row.id, {
                                status: event.target.value as StatusZamowienia,
                              })
                            }
                            className="rounded-md border border-white/10 bg-[#0f1117] px-3 py-2 text-white outline-none focus:border-[#22c55e]"
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${deliveryClasses[row.dostawa_status]}`}
                          >
                            {deliveryLabels[row.dostawa_status]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isDirty ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => saveRow(row)}
                              className="rounded-md bg-[#22c55e] px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
                            >
                              Zapisz zmiany
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/10 px-5 py-4 text-lg font-semibold">
              SUMA: {normalTotal} normalne + {dietsTotal} diety
            </div>
          </section>
        )
      })}

      {isModalOpen ? (
        <ManualOrderModal
          date={date}
          placowki={placowki}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </div>
  )
}

function ManualOrderModal({
  date,
  placowki,
  onClose,
}: {
  date: string
  placowki: SelectPlacowka[]
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        action={(formData) => {
          startTransition(async () => {
            const diety = parseDiets(String(formData.get('diety') ?? ''))
            await createZamowienieReczne(
              String(formData.get('placowka_id') ?? ''),
              String(formData.get('data') ?? date),
              String(formData.get('posilek') ?? 'obiad') as TypPosilku,
              Number(formData.get('ilosc') ?? 0),
              diety,
            )
            onClose()
            window.location.reload()
          })
        }}
        className="w-full max-w-xl space-y-4 rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Dodaj zamówienie ręcznie</h3>
          <button type="button" onClick={onClose} className="text-slate-400">
            Zamknij
          </button>
        </div>
        <input type="hidden" name="data" value={date} />
        <select
          name="placowka_id"
          required
          className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white"
        >
          {placowki.map((placowka) => (
            <option key={placowka.id} value={placowka.id}>
              {placowka.nazwa}
            </option>
          ))}
        </select>
        <select
          name="posilek"
          className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white"
        >
          {meals.map((meal) => (
            <option key={meal.key} value={meal.key}>
              {meal.label}
            </option>
          ))}
        </select>
        <input
          name="ilosc"
          type="number"
          min={0}
          defaultValue={0}
          className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white"
        />
        <textarea
          name="diety"
          rows={4}
          placeholder="Diety, jedna na linię, np. 2x bez glutenu"
          className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          Dodaj
        </button>
      </form>
    </div>
  )
}

function parseDiets(value: string): Dieta[] {
  return value
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s*x?\s+(.+)$/i)

      return match
        ? { ilosc: Number(match[1]), nazwa: match[2].trim() }
        : { ilosc: 1, nazwa: line.trim() }
    })
    .filter((dieta) => dieta.nazwa)
}
