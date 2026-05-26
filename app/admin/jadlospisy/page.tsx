import Link from 'next/link'

import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { MenuUpload } from '@/components/menu-upload'
import { createSupabaseServerClient } from '@/lib/supabase-server'

import { deleteMenuEntry } from './actions'

const mealLabels: Record<string, string> = {
  sniadanie: 'Śniadanie',
  obiad: 'Obiad',
  podwieczorek: 'Podwieczorek',
}

interface JadlospisyPageProps {
  searchParams?: {
    filter?: string
    success?: string
  }
}

function getWeekRange(offsetWeeks: number) {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 + offsetWeeks * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  }
}

export default async function JadlospisyPage({
  searchParams,
}: JadlospisyPageProps) {
  const filter = searchParams?.filter ?? 'current'
  const supabase = createSupabaseServerClient()
  let query = supabase
    .from('jadlospisy')
    .select('id, data, posilek, opis')
    .order('data', { ascending: false })
    .order('posilek', { ascending: true })

  if (filter === 'current' || filter === 'next') {
    const range = getWeekRange(filter === 'next' ? 1 : 0)
    query = query.gte('data', range.start).lte('data', range.end)
  }

  const { data: entries } = await query

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Administracja</p>
        <h2 className="mt-2 text-3xl font-semibold">Jadłospisy</h2>
      </div>

      {searchParams?.success === 'updated' ? (
        <p className="rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm text-emerald-200">
          Jadłospis zaktualizowany
        </p>
      ) : null}

      <MenuUpload />

      <div className="flex flex-wrap gap-2">
        {[
          { href: '/admin/jadlospisy?filter=current', label: 'Tydzień bieżący' },
          { href: '/admin/jadlospisy?filter=next', label: 'Tydzień następny' },
          { href: '/admin/jadlospisy?filter=all', label: 'Wszystkie' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-[#22c55e] hover:text-[#22c55e]"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1f2e]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4">Data</th>
                <th className="px-5 py-4">Posiłek</th>
                <th className="px-5 py-4">Opis dania</th>
                <th className="px-5 py-4">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(entries ?? []).map((entry) => (
                <tr key={entry.id}>
                  <td className="px-5 py-4 text-slate-200">{entry.data}</td>
                  <td className="px-5 py-4 text-slate-200">
                    {mealLabels[entry.posilek] ?? entry.posilek}
                  </td>
                  <td className="max-w-xl px-5 py-4 text-slate-200">
                    {entry.opis}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/jadlospisy/${entry.id}/edytuj`}
                        className="rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-[#22c55e] hover:text-[#22c55e]"
                      >
                        Edytuj
                      </Link>
                      <form action={deleteMenuEntry}>
                        <input type="hidden" name="id" value={entry.id} />
                        <ConfirmSubmitButton
                          message="Na pewno usunąć ten wpis jadłospisu?"
                          className="rounded-md border border-red-500/40 px-3 py-2 text-xs font-medium text-red-200 transition hover:border-red-400 hover:text-red-100"
                        >
                          Usuń
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
