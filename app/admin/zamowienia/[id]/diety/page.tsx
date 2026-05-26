import Link from 'next/link'
import { notFound } from 'next/navigation'

import { updateZamowienieDiety } from '@/app/admin/zamowienia/actions'
import { OrderDietsForm } from '@/components/order-diets-form'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const mealLabels: Record<string, string> = {
  sniadanie: 'Śniadanie',
  obiad: 'Obiad',
  podwieczorek: 'Podwieczorek',
}

type RawOrder = {
  id: string
  data: string
  posilek: string
  diety: { nazwa: string; ilosc: number }[] | null
  placowki?: { nazwa?: string } | { nazwa?: string }[] | null
}

export default async function EditOrderDietsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('zamowienia')
    .select('id, data, posilek, diety, placowki(nazwa)')
    .eq('id', params.id)
    .single()

  if (!data) {
    notFound()
  }

  const order = data as RawOrder
  const placowka = Array.isArray(order.placowki)
    ? order.placowki[0]
    : order.placowki

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/zamowienia" className="text-sm text-[#22c55e]">
          Wróć
        </Link>
        <h2 className="mt-3 text-3xl font-semibold">
          Diety — {placowka?.nazwa ?? 'Placówka'} — {order.data} —{' '}
          {mealLabels[order.posilek] ?? order.posilek}
        </h2>
      </div>

      <OrderDietsForm
        action={updateZamowienieDiety}
        orderId={order.id}
        initialDiets={order.diety ?? []}
      />
    </div>
  )
}
