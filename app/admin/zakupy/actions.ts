'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { TypPosilku } from '@/types'

type Dieta = { nazwa: string; ilosc: number }
type Skladnik = { nazwa: string; gramatura_na_porcje: number }

type MenuRow = {
  data: string
  posilek: TypPosilku
  opis: string | null
  skladniki: Skladnik[] | null
}

type OrderRow = {
  placowka_id: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: Dieta[] | null
}

export interface SkladnikZakupowy {
  nazwa: string
  posilek: string
  gramatura_na_porcje: number
  ilosc_porcji: number
  ilosc_g: number
  ilosc_kg: number
}

export interface BrakGramatur {
  posilek: string
  opis: string
}

export interface ListaZakupow {
  data: string
  liczba_placowek: number
  lacznie_porcji: number
  skladniki: SkladnikZakupowy[]
  bez_gramatur: BrakGramatur[]
  blad?: string
}

export async function generateListaZakupow(data: string): Promise<ListaZakupow> {
  const supabase = createSupabaseServerClient()
  const [{ data: jadlospisy }, { data: zamowienia }] = await Promise.all([
    supabase
      .from('jadlospisy')
      .select('data, posilek, opis, skladniki')
      .eq('data', data),
    supabase
      .from('zamowienia')
      .select('placowka_id, posilek, ilosc_normalnych, diety')
      .eq('data', data),
  ])
  const menuRows = (jadlospisy ?? []) as MenuRow[]
  const orderRows = (zamowienia ?? []) as OrderRow[]

  if (menuRows.length === 0) {
    return {
      data,
      liczba_placowek: 0,
      lacznie_porcji: 0,
      skladniki: [],
      bez_gramatur: [],
      blad: 'Brak jadłospisu na ten dzień',
    }
  }

  if (orderRows.length === 0) {
    return {
      data,
      liczba_placowek: 0,
      lacznie_porcji: 0,
      skladniki: [],
      bez_gramatur: [],
      blad: 'Brak zamówień na ten dzień',
    }
  }

  const portionsByMeal = new Map<TypPosilku, number>()
  const placowki = new Set<string>()

  orderRows.forEach((order) => {
    placowki.add(order.placowka_id)
    const dietsTotal = (order.diety ?? []).reduce(
      (sum, dieta) => sum + dieta.ilosc,
      0,
    )
    portionsByMeal.set(
      order.posilek,
      (portionsByMeal.get(order.posilek) ?? 0) +
        order.ilosc_normalnych +
        dietsTotal,
    )
  })

  const ingredients = new Map<string, SkladnikZakupowy>()
  const missing: BrakGramatur[] = []

  menuRows.forEach((menu) => {
    const portions = portionsByMeal.get(menu.posilek) ?? 0
    const skladniki = menu.skladniki ?? []

    if (skladniki.length === 0) {
      missing.push({
        posilek: menu.posilek,
        opis: menu.opis ?? 'Bez opisu',
      })
      return
    }

    skladniki.forEach((skladnik) => {
      const key = `${skladnik.nazwa.toLowerCase()}::${menu.posilek}`
      const grams = skladnik.gramatura_na_porcje * portions
      const existing = ingredients.get(key)

      if (existing) {
        existing.ilosc_g += grams
        existing.ilosc_kg = existing.ilosc_g / 1000
        return
      }

      ingredients.set(key, {
        nazwa: skladnik.nazwa,
        posilek: menu.posilek,
        gramatura_na_porcje: skladnik.gramatura_na_porcje,
        ilosc_porcji: portions,
        ilosc_g: grams,
        ilosc_kg: grams / 1000,
      })
    })
  })

  const skladniki = Array.from(ingredients.values()).sort((a, b) => {
    return a.nazwa.localeCompare(b.nazwa) || a.posilek.localeCompare(b.posilek)
  })

  return {
    data,
    liczba_placowek: placowki.size,
    lacznie_porcji: Array.from(portionsByMeal.values()).reduce(
      (sum, value) => sum + value,
      0,
    ),
    skladniki,
    bez_gramatur: missing,
  }
}
