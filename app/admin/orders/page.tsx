import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // admin power
  )

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Admin Orders</h1>
        <p style={{ color: 'crimson' }}>{error.message}</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 40 }}>
      <h1>Admin Orders</h1>

      {orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <strong>Order No:</strong> {order.order_no} <br />
          <strong>Status:</strong> {order.status} <br />
          <strong>Payment:</strong> {order.payment_status} <br />
          <strong>Total:</strong> ₹{order.grand_total} <br />
          <strong>Customer:</strong> {order.shipping_name} <br />
          <strong>Phone:</strong> {order.shipping_phone} <br />
          <strong>City:</strong> {order.shipping_city}
        </div>
      ))}
    </main>
  )
}
