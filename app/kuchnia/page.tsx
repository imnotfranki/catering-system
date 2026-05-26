import { KitchenMonitor } from '@/components/kitchen-monitor'

import { getTodayKitchenOrders } from './actions'

export default async function KuchniaPage() {
  const orders = await getTodayKitchenOrders()

  return <KitchenMonitor initialOrders={orders} />
}
