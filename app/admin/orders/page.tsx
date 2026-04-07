export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

function formatINR(n?: number | null) {
  if (typeof n !== 'number') return '₹0.00'
  return `₹${(n / 100).toFixed(2)}`
}

export default async function AdminOrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ✅ 1. Fetch all orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (ordersError) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Admin Orders</h1>
        <p style={{ color: 'crimson' }}>{ordersError.message}</p>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Admin Orders</h1>
        <p>No orders found.</p>
      </div>
    )
  }

  // ✅ 2. Fetch order items
  const orderIds = orders.map(o => o.id)

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds)

  const itemsByOrder: Record<string, any[]> = {}

  items?.forEach(item => {
    if (!itemsByOrder[item.order_id]) {
      itemsByOrder[item.order_id] = []
    }
    itemsByOrder[item.order_id].push(item)
  })

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Orders</h1>

      {orders.map(order => (
        <div
          key={order.id}
          style={{
            border: '1px solid #334155',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            background: '#020617',
            color: '#e5e7eb',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{order.order_no}</strong>
            <span>Status: {order.status}</span>
          </div>

          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {new Date(order.created_at).toLocaleString()}
          </div>

          <hr style={{ margin: '10px 0', borderColor: '#1f2937' }} />

          {/* ✅ Order Items */}
          <div>
            {(itemsByOrder[order.id] || []).map(item => (
              <div key={item.id}>
                {item.name} × {item.qty} — {formatINR(item.line_total)}
              </div>
            ))}
          </div>

          <hr style={{ margin: '10px 0', borderColor: '#1f2937' }} />

          {/* ✅ Price Summary */}
          <div>Subtotal: {formatINR(order.subtotal)}</div>
          <div>Delivery: {formatINR(order.delivery_fee)}</div>
          <div>Discount: {formatINR(order.discount)}</div>
          <strong>Total: {formatINR(order.grand_total)}</strong>

          <hr style={{ margin: '10px 0', borderColor: '#1f2937' }} />

          {/* ✅ Customer Shipping Info */}
          <div>
            <strong>Customer</strong>
            <div>{order.shipping_name} • {order.shipping_phone}</div>
            <div>
              {[order.shipping_address_line1, order.shipping_address_line2]
                .filter(Boolean)
                .join(', ')}
            </div>
            <div>
              {[order.shipping_city, order.shipping_state, order.shipping_pin]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>

          <hr style={{ margin: '10px 0', borderColor: '#1f2937' }} />

          {/* ✅ Status Update */}
          <div style={{ marginTop: 8 }}>
            <select
              value={order.status}
              onChange={async (e) => {
                await fetch(`/api/admin/orders/${order.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: e.target.value }),
                })
                location.reload()
              }}
              style={{
                background: '#020617',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '6px',
                borderRadius: 4,
              }}
            >
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* ✅ COD Payment Confirm */}
          {order.payment_status === 'cod_pending' && (
            <button
              style={{
                marginTop: 12,
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              onClick={async () => {
                await fetch(`/api/admin/orders/${order.id}/payment`, {
                  method: 'PATCH',
                })
                location.reload()
              }}
            >
              Mark Payment as Paid
            </button>
          )}
        </div>
      ))}
    </main>
  )
}
