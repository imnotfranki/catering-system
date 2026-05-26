'use client'

import { useState } from 'react'

import type { updateZamowienieDiety } from '@/app/admin/zamowienia/actions'

type Dieta = { id: string; nazwa: string; ilosc: number }

export function OrderDietsForm({
  action,
  orderId,
  initialDiets,
}: {
  action: typeof updateZamowienieDiety
  orderId: string
  initialDiets: { nazwa: string; ilosc: number }[]
}) {
  const [diets, setDiets] = useState<Dieta[]>(
    initialDiets.map((dieta) => ({ ...dieta, id: crypto.randomUUID() })),
  )

  return (
    <form
      action={action}
      className="space-y-5 rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
    >
      <input type="hidden" name="id" value={orderId} />
      <div className="space-y-3">
        {diets.map((dieta) => (
          <div key={dieta.id} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <input
              name="dieta_nazwa"
              defaultValue={dieta.nazwa}
              placeholder="Nazwa diety"
              className="rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
            <input
              name="dieta_ilosc"
              type="number"
              min={1}
              defaultValue={dieta.ilosc}
              className="rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
            <button
              type="button"
              onClick={() =>
                setDiets((current) => current.filter((item) => item.id !== dieta.id))
              }
              className="rounded-md border border-red-500/40 px-4 py-3 text-sm text-red-200"
            >
              Usuń
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          setDiets((current) => [
            ...current,
            { id: crypto.randomUUID(), nazwa: '', ilosc: 1 },
          ])
        }
        className="rounded-md border border-white/10 px-4 py-3 text-sm font-medium text-[#22c55e]"
      >
        + Dodaj dietę
      </button>
      <div>
        <button
          type="submit"
          className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Zapisz
        </button>
      </div>
    </form>
  )
}
