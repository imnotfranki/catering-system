import { DriverDeliveries } from '@/components/driver-deliveries'

import { getDostawyNaDzis } from './actions'

export default async function KierowcaPage() {
  const today = new Date().toISOString().slice(0, 10)
  const deliveries = await getDostawyNaDzis()
  const dateLabel = new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'full',
  }).format(new Date(`${today}T00:00:00.000Z`))

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className="text-sm font-medium text-[#22c55e]">Trasa</p>
        <h2 className="mt-2 text-3xl font-bold">Dostawy — {dateLabel}</h2>
      </div>
      <DriverDeliveries date={today} deliveries={deliveries} />
    </div>
  )
}
