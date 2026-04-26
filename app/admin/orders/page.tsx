export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import AdminOrdersClient from './AdminOrdersClient'

export default async function AdminOrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ✅ ALWAYS fetch latest orders (no cache, no filter)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      status,
      payment_status,
      items_count,
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
    return (
      <pre style={{ padding: 40, color: 'red' }}>
        {error.message}
      </pre>
    )
  }

  const orderIds = orders?.map(o => o.id) ?? []

  // ✅ Fetch order items for ALL orders
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      name,
      price,
      qty
    `)
    .in('order_id', orderIds)

  if (itemsError) {
    return (
      <pre style={{ padding: 40, color: 'red' }}>
        {itemsError.message}
      </pre>
    )
  }

  return (
    <AdminOrdersClient
      orders={orders ?? []}
      items={items ?? []}
    />
  )
}
