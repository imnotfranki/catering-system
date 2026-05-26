'use server'

import { revalidatePath } from 'next/cache'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { JadlospisWpis, Rola, TypPosilku, Zamowienie } from '@/types'

type Dieta = { nazwa: string; ilosc: number }
type MealKey = TypPosilku

const mealKeys: MealKey[] = ['sniadanie', 'obiad', 'podwieczorek']

export interface PlacowkaContext {
  role: Rola
  placowkaId: string
  placowkaName: string
}

export interface SubmitOrderState {
  error?: string
}

export async function getPlacowkaContext(): Promise<PlacowkaContext | null> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rola, placowka_id')
    .eq('id', user.id)
    .single()

  if (!profile?.placowka_id) {
    return null
  }

  const { data: placowka } = await supabase
    .from('placowki')
    .select('nazwa')
    .eq('id', profile.placowka_id)
    .single()

  return {
    role: profile.rola as Rola,
    placowkaId: profile.placowka_id,
    placowkaName: placowka?.nazwa ?? 'Placówka',
  }
}

export async function getTodayOrders(): Promise<Zamowienie[]> {
  const context = await getPlacowkaContext()

  if (!context) {
    return []
  }

  const supabase = createSupabaseServerClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('zamowienia')
    .select('*')
    .eq('placowka_id', context.placowkaId)
    .eq('data', today)
    .order('posilek', { ascending: true })

  return (data ?? []) as Zamowienie[]
}

export async function canPlaceTodayOrder(): Promise<boolean> {
  const context = await getPlacowkaContext()

  if (context?.role === 'admin') {
    return true
  }

  const { deadlineHour, deadlineMinute } = await getDeadlineSettings()
  const now = getWarsawTime()

  return (
    now.hour < deadlineHour ||
    (now.hour === deadlineHour && now.minute < deadlineMinute)
  )
}

export async function submitTodayOrder(
  _state: SubmitOrderState,
  formData: FormData,
): Promise<SubmitOrderState> {
  const context = await getPlacowkaContext()

  if (!context) {
    return { error: 'Brak przypisanej placówki' }
  }

  if (!(await canPlaceTodayOrder())) {
    return {
      error:
        'Termin składania zamówień minął (10:30). Zadzwoń do biura: +48 530 702 000.',
    }
  }

  const supabase = createSupabaseServerClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase
    .from('zamowienia')
    .select('id')
    .eq('placowka_id', context.placowkaId)
    .eq('data', today)
    .limit(1)

  if (existing?.length) {
    revalidatePath('/placowka')
    return {}
  }

  const rows = mealKeys.flatMap((meal) => {
    if (formData.get(`${meal}_skip`) === 'on') {
      return []
    }

    const iloscNormalnych = Number(formData.get(`${meal}_normal`) ?? 0)
    const dietNames = formData.getAll(`${meal}_diet_name`).map(String)
    const dietCounts = formData.getAll(`${meal}_diet_count`).map(Number)
    const diety: Dieta[] = dietNames
      .map((nazwa, index) => ({
        nazwa: nazwa.trim(),
        ilosc: Number.isFinite(dietCounts[index]) ? dietCounts[index] : 0,
      }))
      .filter((dieta) => dieta.nazwa && dieta.ilosc > 0)

    if (iloscNormalnych <= 0 && diety.length === 0) {
      return []
    }

    return [
      {
        placowka_id: context.placowkaId,
        data: today,
        posilek: meal,
        ilosc_normalnych: Math.max(iloscNormalnych, 0),
        diety,
        status: 'oczekujace',
      },
    ]
  })

  if (rows.length === 0) {
    return { error: 'Dodaj przynajmniej jeden posiłek do zamówienia' }
  }

  const { error } = await supabase.from('zamowienia').insert(rows)

  if (error) {
    return { error: 'Błąd zapisu zamówienia' }
  }

  revalidatePath('/placowka')
  return {}
}

export async function getOrderHistory(month: string, page: number) {
  const context = await getPlacowkaContext()

  if (!context) {
    return { orders: [] as Zamowienie[], count: 0 }
  }

  const safePage = Math.max(page, 1)
  const pageSize = 20
  const start = `${month}-01`
  const endDate = new Date(`${start}T00:00:00.000Z`)
  endDate.setUTCMonth(endDate.getUTCMonth() + 1)
  const end = endDate.toISOString().slice(0, 10)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1
  const supabase = createSupabaseServerClient()
  const { data, count } = await supabase
    .from('zamowienia')
    .select('*', { count: 'exact' })
    .eq('placowka_id', context.placowkaId)
    .gte('data', start)
    .lt('data', end)
    .order('data', { ascending: false })
    .order('posilek', { ascending: true })
    .range(from, to)

  return { orders: (data ?? []) as Zamowienie[], count: count ?? 0 }
}

export async function getCurrentWeekMenu() {
  const supabase = createSupabaseServerClient()
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const start = monday.toISOString().slice(0, 10)
  const end = friday.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('jadlospisy')
    .select('*')
    .gte('data', start)
    .lte('data', end)
    .order('data', { ascending: true })

  return {
    start,
    end,
    entries: (data ?? []) as JadlospisWpis[],
  }
}

async function getDeadlineSettings() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('ustawienia')
    .select('klucz, wartosc')
    .in('klucz', ['deadline_godzina', 'deadline_minuta'])

  const settings = Object.fromEntries(
    (data ?? []).map((item) => [item.klucz, item.wartosc]),
  )
  const deadlineHour = Number(settings.deadline_godzina ?? 10)
  const deadlineMinute = Number(settings.deadline_minuta ?? 30)

  return {
    deadlineHour:
      Number.isFinite(deadlineHour) && deadlineHour >= 0 && deadlineHour <= 23
        ? deadlineHour
        : 10,
    deadlineMinute:
      Number.isFinite(deadlineMinute) &&
      deadlineMinute >= 0 &&
      deadlineMinute <= 59
        ? deadlineMinute
        : 30,
  }
}

function getWarsawTime() {
  const parts = new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  return {
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? 0),
    minute: Number(parts.find((part) => part.type === 'minute')?.value ?? 0),
  }
}
