import { OrderForm } from '@/components/order-form'

import {
  canPlaceTodayOrder,
  getTodayOrders,
  submitTodayOrder,
} from './actions'

const mealLabels: Record<string, string> = {
  sniadanie: 'Śniadanie',
  obiad: 'Obiad',
  podwieczorek: 'Podwieczorek',
}

function formatDiets(diety: unknown) {
  if (!Array.isArray(diety) || diety.length === 0) {
    return 'brak'
  }

  return diety
    .map((dieta) => {
      if (
        typeof dieta === 'object' &&
        dieta !== null &&
        'ilosc' in dieta &&
        'nazwa' in dieta
      ) {
        return `${dieta.ilosc}x ${dieta.nazwa}`
      }

      return null
    })
    .filter(Boolean)
    .join(', ')
}

export default async function PlacowkaPage() {
  const [orders, canOrder] = await Promise.all([
    getTodayOrders(),
    canPlaceTodayOrder(),
  ])

  if (orders.length > 0) {
    const timestamp = orders[0]?.utworzone_o
      ? new Intl.DateTimeFormat('pl-PL', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(orders[0].utworzone_o))
      : null

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-[#22c55e]">
            Zamówienie przyjęte
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Zamówienie na dziś</h2>
          {timestamp ? (
            <p className="mt-2 text-sm text-slate-400">Złożono: {timestamp}</p>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {orders.map((order) => (
            <section
              key={order.id}
              className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5"
            >
              <h3 className="text-xl font-semibold">
                {mealLabels[order.posilek] ?? order.posilek}
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-400">Porcje normalne</dt>
                  <dd className="font-medium text-white">
                    {order.ilosc_normalnych}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Diety</dt>
                  <dd className="font-medium text-white">
                    {formatDiets(order.diety)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Status</dt>
                  <dd className="font-medium text-[#22c55e]">{order.status}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Zamówienie</p>
        <h2 className="mt-2 text-3xl font-semibold">Zamów na dziś</h2>
      </div>

      {!canOrder ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-red-100">
          Termin składania zamówień minął (10:30). Zadzwoń do biura: +48 530
          702 000.
        </div>
      ) : (
        <OrderForm action={submitTodayOrder} />
      )}
    </div>
  )
}
