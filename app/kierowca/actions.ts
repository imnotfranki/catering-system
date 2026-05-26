'use server'

import { revalidatePath } from 'next/cache'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { StatusDostawy, TypPosilku } from '@/types'

type Dieta = { nazwa: string; ilosc: number }

export interface DriverDelivery {
  placowka_id: string
  nazwa: string
  adres: string
  status: StatusDostawy
  czas_dostawy: string | null
  podsumowanie: Record<TypPosilku, { normalne: number; diety: number }>
}

type OrderSummaryRow = {
  placowka_id: string
  posilek: TypPosilku
  ilosc_normalnych: number
  diety: Dieta[] | null
  placowki?: { nazwa?: string; adres?: string } | { nazwa?: string; adres?: string }[] | null
}

type DeliveryRow = {
  placowka_id: string
  status: StatusDostawy | null
  czas_dostawy: string | null
}

const mealKeys: TypPosilku[] = ['sniadanie', 'obiad', 'podwieczorek']

export async function getCurrentDriverId() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export async function getPodsumowanieZamowienia(
  placowkaId: string,
  data: string,
) {
  const supabase = createSupabaseServerClient()
  const { data: rows } = await supabase
    .from('zamowienia')
    .select('posilek, ilosc_normalnych, diety')
    .eq('placowka_id', placowkaId)
    .eq('data', data)

  return mealKeys.reduce(
    (summary, meal) => {
      const row = (rows ?? []).find((item) => item.posilek === meal)
      summary[meal] = {
        normalne: row?.ilosc_normalnych ?? 0,
        diety: Array.isArray(row?.diety)
          ? row.diety.reduce((sum: number, dieta: Dieta) => sum + dieta.ilosc, 0)
          : 0,
      }
      return summary
    },
    {} as DriverDelivery['podsumowanie'],
  )
}

export async function getDostawyNaDzis(
  kierowcaId: string | null,
): Promise<DriverDelivery[]> {
  const supabase = createSupabaseServerClient()
  const today = new Date().toISOString().slice(0, 10)
  const [{ data: orderRows }, { data: deliveryRows }] = await Promise.all([
    supabase
      .from('zamowienia')
      .select('placowka_id, posilek, ilosc_normalnych, diety, placowki(nazwa, adres)')
      .eq('data', today),
    supabase
      .from('dostawy')
      .select('placowka_id, status, czas_dostawy')
      .eq('data', today),
  ])
  const deliveries = new Map(
    ((deliveryRows ?? []) as DeliveryRow[]).map((row) => [row.placowka_id, row]),
  )
  const grouped = new Map<string, DriverDelivery>()

  ;((orderRows ?? []) as OrderSummaryRow[]).forEach((row) => {
    const placowka = Array.isArray(row.placowki) ? row.placowki[0] : row.placowki
    const delivery = deliveries.get(row.placowka_id)

    if (!grouped.has(row.placowka_id)) {
      grouped.set(row.placowka_id, {
        placowka_id: row.placowka_id,
        nazwa: placowka?.nazwa ?? 'Placówka',
        adres: placowka?.adres ?? '',
        status: delivery?.status ?? 'oczekuje',
        czas_dostawy: delivery?.czas_dostawy ?? null,
        podsumowanie: {
          sniadanie: { normalne: 0, diety: 0 },
          obiad: { normalne: 0, diety: 0 },
          podwieczorek: { normalne: 0, diety: 0 },
        },
      })
    }

    const item = grouped.get(row.placowka_id)

    if (item) {
      item.podsumowanie[row.posilek] = {
        normalne: row.ilosc_normalnych,
        diety: (row.diety ?? []).reduce((sum, dieta) => sum + dieta.ilosc, 0),
      }
    }
  })

  if (kierowcaId) {
    await Promise.all(
      Array.from(grouped.values()).map((delivery) =>
        supabase.from('dostawy').upsert(
          {
            placowka_id: delivery.placowka_id,
            data: today,
            kierowca_id: kierowcaId,
            status: delivery.status,
          },
          { onConflict: 'placowka_id,data' },
        ),
      ),
    )
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const order: Record<StatusDostawy, number> = {
      w_drodze: 0,
      oczekuje: 1,
      dostarczone: 2,
    }

    return order[a.status] - order[b.status] || a.nazwa.localeCompare(b.nazwa)
  })
}

export async function updateStatusDostawy(
  placowkaId: string,
  data: string,
  status: StatusDostawy,
) {
  const kierowcaId = await getCurrentDriverId()
  const supabase = createSupabaseServerClient()
  const patch: Record<string, string | null> = { status }

  if (status === 'w_drodze') {
    patch.czas_wyjazdu = new Date().toISOString()
  }

  if (status === 'dostarczone') {
    patch.czas_dostawy = new Date().toISOString()
  }

  await supabase.from('dostawy').upsert(
    {
      placowka_id: placowkaId,
      data,
      kierowca_id: kierowcaId,
      ...patch,
    },
    { onConflict: 'placowka_id,data' },
  )

  revalidatePath('/kierowca')
  revalidatePath('/admin/zamowienia')
}
