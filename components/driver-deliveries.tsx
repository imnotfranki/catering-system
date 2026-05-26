'use client'

import { useState, useTransition } from 'react'

import {
  type DriverDelivery,
  updateStatusDostawy,
} from '@/app/kierowca/actions'
import type { StatusDostawy } from '@/types'

const labels: Record<StatusDostawy, string> = {
  oczekuje: 'OCZEKUJE',
  w_drodze: 'W DRODZE',
  dostarczone: 'DOSTARCZONE',
}

const classes: Record<StatusDostawy, string> = {
  oczekuje: 'bg-slate-700 text-white',
  w_drodze: 'bg-yellow-400 text-slate-950',
  dostarczone: 'bg-[#22c55e] text-slate-950',
}

function nextStatus(status: StatusDostawy): StatusDostawy {
  if (status === 'oczekuje') {
    return 'w_drodze'
  }

  if (status === 'w_drodze') {
    return 'dostarczone'
  }

  return 'dostarczone'
}

function summary(delivery: DriverDelivery) {
  return [
    ['Śniadanie', delivery.podsumowanie.sniadanie],
    ['Obiad', delivery.podsumowanie.obiad],
    ['Podwieczorek', delivery.podsumowanie.podwieczorek],
  ]
    .map(([label, item]) => {
      const value = item as { normalne: number; diety: number }
      return `${label}: ${value.normalne}${value.diety ? `+${value.diety}d` : ''}`
    })
    .join(' | ')
}

export function DriverDeliveries({
  date,
  deliveries,
}: {
  date: string
  deliveries: DriverDelivery[]
}) {
  const [items, setItems] = useState(deliveries)
  const [isPending, startTransition] = useTransition()
  const deliveredCount = items.filter((item) => item.status === 'dostarczone').length

  function update(delivery: DriverDelivery) {
    if (delivery.status === 'dostarczone') {
      return
    }

    const status = nextStatus(delivery.status)
    const timestamp = status === 'dostarczone' ? new Date().toISOString() : null

    setItems((current) =>
      current
        .map((item) =>
          item.placowka_id === delivery.placowka_id
            ? { ...item, status, czas_dostawy: timestamp ?? item.czas_dostawy }
            : item,
        )
        .sort(sortDeliveries),
    )
    startTransition(async () => {
      await updateStatusDostawy(delivery.placowka_id, date, status)
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5">
        <p className="text-sm text-slate-400">Dostarczone</p>
        <p className="mt-2 text-4xl font-black text-[#22c55e]">
          {deliveredCount} / {items.length}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((delivery) => (
          <article
            key={delivery.placowka_id}
            className="rounded-lg border border-white/10 bg-[#1a1f2e] p-5"
          >
            <h2 className="text-2xl font-bold">{delivery.nazwa}</h2>
            <p className="mt-2 text-base text-slate-300">{delivery.adres}</p>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              {summary(delivery)}
            </p>
            <button
              type="button"
              disabled={delivery.status === 'dostarczone' || isPending}
              onClick={() => update(delivery)}
              className={`mt-5 w-full rounded-lg px-5 py-5 text-xl font-black ${classes[delivery.status]} disabled:opacity-90`}
            >
              {labels[delivery.status]}
            </button>
            {delivery.czas_dostawy ? (
              <p className="mt-3 text-center text-sm text-slate-400">
                Dostarczono:{' '}
                {new Intl.DateTimeFormat('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(delivery.czas_dostawy))}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

function sortDeliveries(a: DriverDelivery, b: DriverDelivery) {
  const order: Record<StatusDostawy, number> = {
    w_drodze: 0,
    oczekuje: 1,
    dostarczone: 2,
  }

  return order[a.status] - order[b.status] || a.nazwa.localeCompare(b.nazwa)
}
