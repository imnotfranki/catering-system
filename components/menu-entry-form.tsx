'use client'

import { useState } from 'react'

import type { updateMenuEntry } from '@/app/admin/jadlospisy/actions'

type Ingredient = {
  id: string
  nazwa: string
  gramatura_na_porcje: number
}

interface MenuEntryFormProps {
  action: typeof updateMenuEntry
  entry: {
    id: string
    data: string
    posilek: string
    opis: string
    skladniki: { nazwa: string; gramatura_na_porcje: number }[]
  }
}

export function MenuEntryForm({ action, entry }: MenuEntryFormProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    entry.skladniki.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    })),
  )

  return (
    <form
      action={action}
      className="space-y-5 rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
    >
      <input type="hidden" name="id" value={entry.id} />
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-300">Data</span>
        <input
          name="data"
          type="date"
          required
          defaultValue={entry.data}
          className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-300">
          Posiłek
        </span>
        <select
          name="posilek"
          defaultValue={entry.posilek}
          className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
        >
          <option value="sniadanie">śniadanie</option>
          <option value="obiad">obiad</option>
          <option value="podwieczorek">podwieczorek</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-300">
          Opis dania
        </span>
        <textarea
          name="opis"
          rows={5}
          defaultValue={entry.opis}
          className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
        />
      </label>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-300">Składniki</p>
        {ingredients.map((ingredient) => (
          <div key={ingredient.id} className="grid gap-2 sm:grid-cols-[1fr_170px_auto]">
            <input
              name="skladnik_nazwa"
              defaultValue={ingredient.nazwa}
              placeholder="Nazwa składnika"
              className="rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
            <input
              name="skladnik_gramatura"
              type="number"
              min={0}
              defaultValue={ingredient.gramatura_na_porcje}
              placeholder="Gramatura"
              className="rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
            <button
              type="button"
              onClick={() =>
                setIngredients((current) =>
                  current.filter((item) => item.id !== ingredient.id),
                )
              }
              className="rounded-md border border-red-500/40 px-4 py-3 text-sm text-red-200"
            >
              Usuń
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setIngredients((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                nazwa: '',
                gramatura_na_porcje: 0,
              },
            ])
          }
          className="rounded-md border border-white/10 px-4 py-3 text-sm font-medium text-[#22c55e]"
        >
          + Dodaj składnik
        </button>
      </div>

      <button
        type="submit"
        className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        Zapisz
      </button>
    </form>
  )
}
