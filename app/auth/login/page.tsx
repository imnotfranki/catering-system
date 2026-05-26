import { redirect } from 'next/navigation'

import { getRoleHome, getUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

interface LoginPageProps {
  searchParams?: {
    error?: string
  }
}

const errorMessages: Record<string, string> = {
  invalid: 'Nieprawidłowy email lub hasło',
  email_not_confirmed: 'Sprawdź skrzynkę email',
  missing_role: 'Brak przypisanej roli użytkownika',
}

async function login(formData: FormData) {
  'use server'

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const errorCode = error.message.toLowerCase().includes('email not confirmed')
      ? 'email_not_confirmed'
      : 'invalid'

    redirect(`/auth/login?error=${errorCode}`)
  }

  const role = await getUserRole(supabase)

  if (!role) {
    redirect('/auth/login?error=missing_role')
  }

  redirect(getRoleHome(role))
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage = searchParams?.error
    ? errorMessages[searchParams.error]
    : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4 py-12 text-slate-100">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
            CateringSystem
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white">Logowanie</h1>
        </div>

        <form action={login} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="adres@email.pl"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Hasło
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-white/10 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Wpisz hasło"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#0f1117]"
          >
            Zaloguj się
          </button>
        </form>
      </section>
    </main>
  )
}
