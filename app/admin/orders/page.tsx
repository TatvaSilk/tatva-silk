export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import AdminOrdersClient from './AdminOrdersClient'

export default async function AdminOrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ✅ IMPORTANT: Explicitly select shipping fields
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      status,
      payment_status,
      subtotal,
      delivery_fee,
      discount,
      grand_total,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_pin
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <pre style={{ padding: 40 }}>{error.message}</pre>
  }

  const orderIds = orders.map(o => o.id)

  const { data: items } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      name,
      price,
      qty
    `)
    .in('order_id', orderIds)

  return (
    <AdminOrdersClient
      orders={orders}
      items={items ?? []}
    />
  )
}
