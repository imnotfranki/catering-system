'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { TypPosilku } from '@/types'

const mealTypes: TypPosilku[] = ['sniadanie', 'obiad', 'podwieczorek']

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function deleteMenuEntry(formData: FormData) {
  const id = text(formData, 'id')
  const supabase = createSupabaseServerClient()

  await supabase.from('jadlospisy').delete().eq('id', id)
  revalidatePath('/admin/jadlospisy')
}

export async function updateMenuEntry(formData: FormData) {
  const id = text(formData, 'id')
  const data = text(formData, 'data')
  const posilek = text(formData, 'posilek') as TypPosilku
  const opis = text(formData, 'opis')
  const ingredientNames = formData.getAll('skladnik_nazwa').map(String)
  const ingredientWeights = formData
    .getAll('skladnik_gramatura')
    .map((value) => Number(value))

  if (!mealTypes.includes(posilek)) {
    redirect(`/admin/jadlospisy/${id}/edytuj?error=invalid_meal`)
  }

  const skladniki = ingredientNames
    .map((nazwa, index) => ({
      nazwa: nazwa.trim(),
      gramatura_na_porcje: Number.isFinite(ingredientWeights[index])
        ? ingredientWeights[index]
        : 0,
    }))
    .filter((item) => item.nazwa)

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('jadlospisy')
    .update({ data, posilek, opis, skladniki })
    .eq('id', id)

  if (error) {
    redirect(`/admin/jadlospisy/${id}/edytuj?error=save`)
  }

  revalidatePath('/admin/jadlospisy')
  revalidatePath(`/admin/jadlospisy/${id}/edytuj`)
  redirect('/admin/jadlospisy?success=updated')
}
