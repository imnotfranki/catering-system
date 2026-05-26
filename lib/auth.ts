import type { SupabaseClient } from '@supabase/supabase-js'

import type { Rola } from '@/types'

export const ROLE_HOME: Record<Rola, string> = {
  admin: '/admin',
  placowka: '/placowka',
  kuchnia: '/kuchnia',
  kierowca: '/kierowca',
}

export async function getUserRole(
  supabase: SupabaseClient,
): Promise<Rola | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('rola')
    .eq('id', user.id)
    .single()

  if (error || !data?.rola) {
    return null
  }

  return data.rola as Rola
}

export function getRoleHome(role: Rola | null): string {
  return role ? ROLE_HOME[role] : '/auth/login'
}
