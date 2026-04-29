import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      status,
      grand_total,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_city,
      shipping_state,
      shipping_pin,
      order_items (
        name,
        qty,
        price
      )
    `)
    .eq('id', params.id)
    .single()

  if (!order) return <div>Order not found</div>

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Order {order.order_no}</h1>
      <p>Status: {order.status}</p>
      <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>

      <h3>Items</h3>
      {order.order_items.map((item, i) => (
        <div key={i}>
          {item.name} × {item.qty} — ₹{item.price * item.qty}
        </div>
      ))}

      <h3>Total: ₹{order.grand_total}</h3>

      <h3>Shipping</h3>
      <p>
        {order.shipping_name}, {order.shipping_phone}
        <br />
        {order.shipping_address_line1}, {order.shipping_city},{' '}
        {order.shipping_state} – {order.shipping_pin}
      </p>
    </main>
  )
}
``
