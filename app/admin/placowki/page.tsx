import Link from 'next/link'

import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

import { deletePlacowka, togglePlacowka } from './actions'

const typeLabels: Record<string, string> = {
  zlobek: 'żłobek',
  przedszkole: 'przedszkole',
  szkola: 'szkoła',
  osp: 'OSP',
  dorosli: 'dorośli',
}

interface PlacowkiPageProps {
  searchParams?: {
    success?: string
  }
}

const successMessages: Record<string, string> = {
  created: 'Placówka dodana',
  updated: 'Placówka zaktualizowana',
}

export default async function PlacowkiPage({
  searchParams,
}: PlacowkiPageProps) {
  const supabase = createSupabaseAdminClient()
  const { data: placowki } = await supabase
    .from('placowki')
    .select('id, nazwa, typ, adres, aktywna')
    .order('nazwa', { ascending: true })

  const successMessage = searchParams?.success
    ? successMessages[searchParams.success]
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[#22c55e]">Administracja</p>
          <h2 className="mt-2 text-3xl font-semibold">Placówki</h2>
        </div>
        <Link
          href="/admin/placowki/nowa"
          className="rounded-md bg-[#22c55e] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Dodaj placówkę
        </Link>
      </div>

      {successMessage ? (
        <p className="rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1f2e]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4">Nazwa</th>
                <th className="px-5 py-4">Typ</th>
                <th className="px-5 py-4">Adres</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(placowki ?? []).map((placowka) => (
                <tr key={placowka.id}>
                  <td className="px-5 py-4 font-medium text-white">
                    {placowka.nazwa}
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {typeLabels[placowka.typ ?? ''] ?? placowka.typ}
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {placowka.adres || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                      {placowka.aktywna ? 'aktywna' : 'nieaktywna'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/placowki/${placowka.id}/edytuj`}
                        className="rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-[#22c55e] hover:text-[#22c55e]"
                      >
                        Edytuj
                      </Link>
                      <form action={togglePlacowka}>
                        <input type="hidden" name="id" value={placowka.id} />
                        <input
                          type="hidden"
                          name="aktywna"
                          value={String(placowka.aktywna)}
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-[#22c55e] hover:text-[#22c55e]"
                        >
                          {placowka.aktywna ? 'Dezaktywuj' : 'Aktywuj'}
                        </button>
                      </form>
                      <form action={deletePlacowka}>
                        <input type="hidden" name="id" value={placowka.id} />
                        <ConfirmSubmitButton
                          message="Na pewno usunąć tę placówkę?"
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
