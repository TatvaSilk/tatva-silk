export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import AdminOrdersClient from './AdminOrdersClient'

export default async function AdminOrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <pre style={{ padding: 40 }}>{error.message}</pre>
  }

  const orderIds = orders.map(o => o.id)

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds)

  return (
    <AdminOrdersClient
      orders={orders}
      items={items ?? []}
    />
  )
}
