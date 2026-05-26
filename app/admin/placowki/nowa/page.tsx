import Link from 'next/link'

import { createPlacowka } from '../actions'

const errorMessages: Record<string, string> = {
  missing: 'Uzupełnij wymagane pola',
  email_exists: 'Email już istnieje',
  create_account: 'Błąd tworzenia konta',
}

interface NowaPlacowkaPageProps {
  searchParams?: {
    error?: string
  }
}

export default function NowaPlacowkaPage({
  searchParams,
}: NowaPlacowkaPageProps) {
  const errorMessage = searchParams?.error
    ? errorMessages[searchParams.error]
    : null

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/placowki" className="text-sm text-[#22c55e]">
          Wróć do placówek
        </Link>
        <h2 className="mt-3 text-3xl font-semibold">Dodaj placówkę</h2>
      </div>

      <form
        action={createPlacowka}
        className="space-y-5 rounded-lg border border-white/10 bg-[#1a1f2e] p-6"
      >
        {errorMessage ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Nazwa placówki
          </span>
          <input
            name="nazwa"
            required
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Typ
          </span>
          <select
            name="typ"
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
            className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Email loginu
            </span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Hasło
            </span>
            <input
              name="password"
              type="text"
              required
              className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none focus:border-[#22c55e]"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Dodaj placówkę
        </button>
      </form>
    </div>
  )
}
