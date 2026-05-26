import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createSupabaseAdminClient } from '@/lib/supabase-admin'

import { resetPlacowkaPassword, updatePlacowka } from '../../actions'

interface EdytujPlacowkePageProps {
  params: {
    id: string
  }
  searchParams?: {
    success?: string
  }
}

export default async function EdytujPlacowkePage({
  params,
  searchParams,
}: EdytujPlacowkePageProps) {
  const supabase = createSupabaseAdminClient()
  const { data: placowka } = await supabase
    .from('placowki')
    .select('id, nazwa, typ, adres')
    .eq('id', params.id)
    .single()

  if (!placowka) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('placowka_id', params.id)
    .eq('rola', 'placowka')
    .maybeSingle()

  const { data: authUser } = profile?.id
    ? await supabase.auth.admin.getUserById(profile.id)
    : { data: null }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/placowki" className="text-sm text-[#22c55e]">
          Wróć do placówek
        </Link>
        <h2 className="mt-3 text-3xl font-semibold">Edytuj placówkę</h2>
      </div>

      {searchParams?.success === 'password' ? (
        <p className="rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm text-emerald-200">
          Hasło zresetowane
        </p>
      ) : null}

      <form
        action={updatePlacowka}
        className="space-y-5 rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
      >
        <input type="hidden" name="id" value={placowka.id} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Nazwa placówki
          </span>
          <input
            name="nazwa"
            required
            defaultValue={placowka.nazwa}
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Typ
          </span>
          <select
            name="typ"
            defaultValue={placowka.typ}
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          >
            <option value="zlobek">żłobek</option>
            <option value="przedszkole">przedszkole</option>
            <option value="szkola">szkoła</option>
            <option value="osp">osp</option>
            <option value="dorosli">dorośli</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Adres
          </span>
          <input
            name="adres"
            defaultValue={placowka.adres ?? ''}
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Email
          </span>
          <p className="rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-slate-400">
            {authUser?.user?.email ?? 'Brak przypisanego konta'}
          </p>
        </div>

        <button
          type="submit"
          className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Zapisz zmiany
        </button>
      </form>

      <form
        action={resetPlacowkaPassword}
        className="space-y-5 rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
      >
        <input type="hidden" name="placowka_id" value={placowka.id} />
        <input type="hidden" name="user_id" value={profile?.id ?? ''} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Nowe hasło
          </span>
          <input
            name="password"
            type="text"
            required
            disabled={!profile?.id}
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={!profile?.id}
          className="rounded-md border border-[#22c55e]/60 px-5 py-3 text-sm font-semibold text-[#22c55e] transition hover:bg-[#22c55e] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Resetuj hasło
        </button>
      </form>
    </div>
  )
}
