'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { StatusZamowienia, TypPosilku } from '@/types'

export interface KitchenOrder {
  id: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: { nazwa: string; ilosc: number }[]
  status: StatusZamowienia
  placowka_nazwa: string
}

type RawKitchenOrder = {
  id: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: { nazwa: string; ilosc: number }[] | null
  status: StatusZamowienia
  placowki?: { nazwa?: string } | { nazwa?: string }[] | null
}

export async function getTodayKitchenOrders(): Promise<KitchenOrder[]> {
  const supabase = createSupabaseServerClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('zamowienia')
    .select('id, posilek, ilosc_normalnych, diety, status, placowki(nazwa)')
    .eq('data', today)
    .order('posilek', { ascending: true })
    .order('utworzone_o', { ascending: true })

  return ((data ?? []) as RawKitchenOrder[]).map((order) => {
    const placowki = Array.isArray(order.placowki)
      ? order.placowki[0]
      : order.placowki

    return {
      id: order.id,
      posilek: order.posilek,
      ilosc_normalnych: order.ilosc_normalnych,
      diety: order.diety ?? [],
      status: order.status,
      placowka_nazwa: placowki?.nazwa ?? 'Placówka',
    }
  })
}
