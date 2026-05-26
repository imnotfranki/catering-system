import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Ustawienie } from '@/types'

import { saveSettings } from './actions'

interface UstawieniaPageProps {
  searchParams?: {
    success?: string
  }
}

export default async function UstawieniaPage({
  searchParams,
}: UstawieniaPageProps) {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('ustawienia')
    .select('klucz, wartosc, opis')
    .in('klucz', ['deadline_godzina', 'deadline_minuta', 'nazwa_systemu'])

  const settings = Object.fromEntries(
    ((data ?? []) as Ustawienie[]).map((item) => [item.klucz, item.wartosc]),
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Administracja</p>
        <h2 className="mt-2 text-3xl font-semibold">Ustawienia systemu</h2>
      </div>

      {searchParams?.success ? (
        <p className="rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm text-emerald-200">
          Ustawienia zapisane
        </p>
      ) : null}

      <form
        action={saveSettings}
        className="space-y-5 rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Deadline godzina
            </span>
            <input
              name="deadline_godzina"
              type="number"
              min={0}
              max={23}
              defaultValue={settings.deadline_godzina ?? '10'}
              className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Deadline minuta
            </span>
            <input
              name="deadline_minuta"
              type="number"
              min={0}
              max={59}
              defaultValue={settings.deadline_minuta ?? '30'}
              className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Nazwa systemu
          </span>
          <input
            name="nazwa_systemu"
            defaultValue={settings.nazwa_systemu ?? 'CateringSystem'}
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Zapisz ustawienia
        </button>
      </form>
    </div>
  )
}
