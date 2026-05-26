'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { StatusZamowienia, TypPosilku } from '@/types'

export type Dieta = { nazwa: string; ilosc: number }

export interface AdminZamowienie {
  id: string
  placowka_id: string
  placowka_nazwa: string
  data: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: Dieta[]
  status: StatusZamowienia
  dostawa_status: 'oczekuje' | 'w_drodze' | 'dostarczone'
}

export interface SelectPlacowka {
  id: string
  nazwa: string
}

type RawZamowienie = {
  id: string
  placowka_id: string
  data: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: Dieta[] | null
  status: StatusZamowienia
  placowki?: { nazwa?: string } | { nazwa?: string }[] | null
}

export async function getZamowieniaByDate(
  data: string,
): Promise<AdminZamowienie[]> {
  const supabase = createSupabaseServerClient()
  const [{ data: rows }, { data: deliveries }] = await Promise.all([
    supabase
      .from('zamowienia')
      .select('id, placowka_id, data, posilek, ilosc_normalnych, diety, status, placowki(nazwa)')
      .eq('data', data)
      .order('posilek', { ascending: true }),
    supabase.from('dostawy').select('placowka_id, status').eq('data', data),
  ])
  const deliveryMap = new Map(
    (deliveries ?? []).map((delivery) => [
      delivery.placowka_id,
      delivery.status as 'oczekuje' | 'w_drodze' | 'dostarczone',
    ]),
  )

  return ((rows ?? []) as RawZamowienie[]).map((row) => {
    const placowka = Array.isArray(row.placowki)
      ? row.placowki[0]
      : row.placowki

    return {
      id: row.id,
      placowka_id: row.placowka_id,
      placowka_nazwa: placowka?.nazwa ?? 'Placówka',
      data: row.data,
      posilek: row.posilek,
      ilosc_normalnych: row.ilosc_normalnych,
      diety: row.diety ?? [],
      status: row.status,
      dostawa_status: deliveryMap.get(row.placowka_id) ?? 'oczekuje',
    }
  })
}

export async function updateZamowienie(
  id: string,
  iloscNormalnych: number,
  diety: Dieta[],
  status: StatusZamowienia,
) {
  const supabase = createSupabaseServerClient()

  await supabase
    .from('zamowienia')
    .update({
      ilosc_normalnych: Math.max(iloscNormalnych, 0),
      diety,
      status,
    })
    .eq('id', id)

  revalidatePath('/admin/zamowienia')
  revalidatePath(`/admin/zamowienia/${id}/diety`)
}

export async function createZamowienieReczne(
  placowkaId: string,
  data: string,
  posilek: TypPosilku,
  ilosc: number,
  diety: Dieta[],
) {
  const supabase = createSupabaseServerClient()

  await supabase.from('zamowienia').insert({
    placowka_id: placowkaId,
    data,
    posilek,
    ilosc_normalnych: Math.max(ilosc, 0),
    diety,
    status: 'oczekujace',
  })

  revalidatePath('/admin/zamowienia')
}

export async function getPlacowkiBezZamowienia(
  data: string,
): Promise<SelectPlacowka[]> {
  const supabase = createSupabaseServerClient()
  const [{ data: placowki }, { data: orders }] = await Promise.all([
    supabase
      .from('placowki')
      .select('id, nazwa')
      .eq('aktywna', true)
      .order('nazwa', { ascending: true }),
    supabase.from('zamowienia').select('placowka_id').eq('data', data),
  ])
  const orderedIds = new Set((orders ?? []).map((order) => order.placowka_id))

  return ((placowki ?? []) as SelectPlacowka[]).filter(
    (placowka) => !orderedIds.has(placowka.id),
  )
}

export async function getActivePlacowki(): Promise<SelectPlacowka[]> {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('placowki')
    .select('id, nazwa')
    .eq('aktywna', true)
    .order('nazwa', { ascending: true })

  return (data ?? []) as SelectPlacowka[]
}

export async function updateZamowienieDiety(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const names = formData.getAll('dieta_nazwa').map(String)
  const counts = formData.getAll('dieta_ilosc').map((value) => Number(value))
  const diety = names
    .map((nazwa, index) => ({
      nazwa: nazwa.trim(),
      ilosc: Number.isFinite(counts[index]) ? counts[index] : 0,
    }))
    .filter((dieta) => dieta.nazwa && dieta.ilosc > 0)
  const supabase = createSupabaseServerClient()

  await supabase.from('zamowienia').update({ diety }).eq('id', id)

  revalidatePath('/admin/zamowienia')
  redirect('/admin/zamowienia')
}
