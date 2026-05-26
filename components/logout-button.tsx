import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'

async function signOut() {
  'use server'

  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()

  redirect('/auth/login')
}

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300"
      >
        Wyloguj
      </button>
    </form>
  )
}
