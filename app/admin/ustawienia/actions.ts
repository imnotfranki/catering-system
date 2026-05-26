'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'

function clampNumber(value: FormDataEntryValue | null, min: number, max: number) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return min
  }

  return Math.min(Math.max(numberValue, min), max)
}

export async function saveSettings(formData: FormData) {
  const supabase = createSupabaseServerClient()
  const deadlineHour = clampNumber(formData.get('deadline_godzina'), 0, 23)
  const deadlineMinute = clampNumber(formData.get('deadline_minuta'), 0, 59)
  const systemName = String(formData.get('nazwa_systemu') ?? 'CateringSystem').trim()

  await supabase.from('ustawienia').upsert([
    {
      klucz: 'deadline_godzina',
      wartosc: String(deadlineHour),
      opis: 'Godzina do której placówki mogą składać zamówienia',
    },
    {
      klucz: 'deadline_minuta',
      wartosc: String(deadlineMinute),
      opis: 'Minuta deadline zamówień',
    },
    {
      klucz: 'nazwa_systemu',
      wartosc: systemName || 'CateringSystem',
      opis: 'Nazwa wyświetlana w systemie',
    },
  ])

  revalidatePath('/admin/ustawienia')
  revalidatePath('/placowka')
  redirect('/admin/ustawienia?success=1')
}
