'use client'

import { useMemo, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import type { submitTodayOrder } from '@/app/placowka/actions'

type MealKey = 'sniadanie' | 'obiad' | 'podwieczorek'
type DietRow = { id: string; nazwa: string; ilosc: number }
type MealState = { skip: boolean; normal: number; diets: DietRow[] }

const meals: { key: MealKey; label: string }[] = [
  { key: 'sniadanie', label: 'Śniadanie' },
  { key: 'obiad', label: 'Obiad' },
  { key: 'podwieczorek', label: 'Podwieczorek' },
]

const initialMeals: Record<MealKey, MealState> = {
  sniadanie: { skip: false, normal: 0, diets: [] },
  obiad: { skip: false, normal: 0, diets: [] },
  podwieczorek: { skip: false, normal: 0, diets: [] },
}

interface OrderFormProps {
  action: typeof submitTodayOrder
}

export function OrderForm({ action }: OrderFormProps) {
  const [state, formAction] = useFormState(action, {})
  const [order, setOrder] = useState(initialMeals)

  const totals = useMemo(() => {
    return meals.reduce(
      (sum, meal) => {
        const section = order[meal.key]

        if (section.skip) {
          return sum
        }

        return {
          normal: sum.normal + section.normal,
          diets:
            sum.diets +
            section.diets.reduce((dietSum, dieta) => dietSum + dieta.ilosc, 0),
        }
      },
      { normal: 0, diets: 0 },
    )
  }, [order])

  function updateMeal(meal: MealKey, patch: Partial<MealState>) {
    setOrder((current) => ({
      ...current,
      [meal]: { ...current[meal], ...patch },
    }))
  }

  function updateDiet(meal: MealKey, id: string, patch: Partial<DietRow>) {
    updateMeal(meal, {
      diets: order[meal].diets.map((diet) =>
        diet.id === id ? { ...diet, ...patch } : diet,
      ),
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {meals.map((meal) => {
          const section = order[meal.key]

          return (
            <section
              key={meal.key}
              className={`rounded-lg border border-white/10 bg-[#1a1f2e] p-5 transition ${
                section.skip ? 'opacity-50' : ''
              }`}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">{meal.label}</h2>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    name={`${meal.key}_skip`}
                    type="checkbox"
                    checked={section.skip}
                    onChange={(event) =>
                      updateMeal(meal.key, { skip: event.target.checked })
                    }
                    className="h-4 w-4 accent-[#22c55e]"
                  />
                  Nie zamawiamy
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Liczba porcji normalnych
                </span>
                <input
                  name={`${meal.key}_normal`}
                  type="number"
                  min={0}
                  value={section.normal}
                  disabled={section.skip}
                  onChange={(event) =>
                    updateMeal(meal.key, {
                      normal: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e] disabled:cursor-not-allowed"
                />
              </label>

              <div className="mt-5 space-y-3">
                <p className="text-sm font-medium text-slate-300">Diety</p>
                {section.diets.map((diet) => (
                  <div key={diet.id} className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
                    <input
                      name={`${meal.key}_diet_name`}
                      value={diet.nazwa}
                      disabled={section.skip}
                      onChange={(event) =>
                        updateDiet(meal.key, diet.id, {
                          nazwa: event.target.value,
                        })
                      }
                      placeholder="Nazwa diety/wykluczenia"
                      className="rounded-md border border-white/10 bg-[#0f1117] px-3 py-2 text-sm text-white outline-none focus:border-[#22c55e] disabled:cursor-not-allowed"
                    />
                    <input
                      name={`${meal.key}_diet_count`}
                      type="number"
                      min={1}
                      value={diet.ilosc}
                      disabled={section.skip}
                      onChange={(event) =>
                        updateDiet(meal.key, diet.id, {
                          ilosc: Number(event.target.value),
                        })
                      }
                      className="rounded-md border border-white/10 bg-[#0f1117] px-3 py-2 text-sm text-white outline-none focus:border-[#22c55e] disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      disabled={section.skip}
                      onClick={() =>
                        updateMeal(meal.key, {
                          diets: section.diets.filter((item) => item.id !== diet.id),
                        })
                      }
                      className="rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-200 disabled:cursor-not-allowed"
                    >
                      Usuń
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={section.skip}
                  onClick={() =>
                    updateMeal(meal.key, {
                      diets: [
                        ...section.diets,
                        { id: crypto.randomUUID(), nazwa: '', ilosc: 1 },
                      ],
                    })
                  }
                  className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-[#22c55e] disabled:cursor-not-allowed"
                >
                  + Dodaj dietę
                </button>
              </div>
            </section>
          )
        })}
      </div>

      <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
        <p className="text-lg font-semibold">
          Razem dziś: {totals.normal} porcji normalnych + {totals.diets} diet
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Zamówienia przyjmujemy do 10:30
        </p>
        <SubmitButton />
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full rounded-md bg-[#22c55e] px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      Złóż zamówienie
    </button>
  )
}
