import { getCurrentWeekMenu } from '../actions'

const meals = [
  { key: 'sniadanie', label: 'Śniadanie' },
  { key: 'obiad', label: 'Obiad' },
  { key: 'podwieczorek', label: 'Podwieczorek' },
] as const

const dayNames = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek']

export default async function JadlospisPage() {
  const { start, entries } = await getCurrentWeekMenu()
  const monday = new Date(`${start}T00:00:00.000Z`)
  const days = dayNames.map((name, index) => {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + index)

    return {
      name,
      date: date.toISOString().slice(0, 10),
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Tydzień</p>
        <h2 className="mt-2 text-3xl font-semibold">Jadłospis</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {days.map((day) => (
          <section
            key={day.date}
            className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5"
          >
            <h3 className="text-lg font-semibold">{day.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{day.date}</p>
            <div className="mt-5 space-y-4">
              {meals.map((meal) => {
                const entry = entries.find(
                  (item) => item.data === day.date && item.posilek === meal.key,
                )

                return (
                  <div
                    key={meal.key}
                    className="rounded-md border border-white/10 bg-[#0f1117] p-4"
                  >
                    <p className="text-sm font-semibold text-[#22c55e]">
                      {meal.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {entry?.opis || 'Brak jadłospisu'}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
