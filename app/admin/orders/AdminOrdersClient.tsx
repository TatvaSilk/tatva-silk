'use client'

import { formatINR } from '@/lib/money'

export default function AdminOrdersClient({
  orders,
  items,
}: {
  orders: any[]
  items: any[]
}) {
  const itemsByOrder: Record<string, any[]> = {}

  items.forEach(item => {
    const key = String(item.order_id)
    if (!itemsByOrder[key]) itemsByOrder[key] = []
    itemsByOrder[key].push(item)
  })

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Orders</h1>

      {orders.map(order => {
        const orderItems = itemsByOrder[String(order.id)] || []

        return (
          <div
            key={order.id}
            style={{
              background: '#020617',
              color: '#e5e7eb',
              padding: 20,
              borderRadius: 12,
              marginBottom: 32,
              border: '1px solid #334155',
            }}
          >
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{order.order_no}</strong>
              <span>Status: {order.status}</span>
            </div>

            {/* DATE */}
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Order Date: {new Date(order.created_at).toLocaleString('en-IN')}
            </div>

            <hr />

            {/* ITEMS */}
            {orderItems.map(item => (
              <div key={item.id}>
                {item.name} × {item.qty} — {formatINR(item.price * item.qty)}
              </div>
            ))}

            <hr />

            {/* TOTALS */}
            <div>Subtotal: {formatINR(order.subtotal)}</div>
            <div>Delivery: {formatINR(order.delivery_fee)}</div>
            <div>Discount: {formatINR(order.discount)}</div>
            <strong>Total: {formatINR(order.grand_total)}</strong>

            <hr />

            {/* ✅ SHIPPING (WILL NOW SHOW) */}
            <h4>Shipping</h4>
            <div style={{ fontSize: 14 }}>
              <div>
                {order.shipping_name} • {order.shipping_phone}
              </div>
              <div>
                {order.shipping_address_line1}
                {order.shipping_address_line2
                  ? `, ${order.shipping_address_line2}`
                  : ''}
              </div>
              <div>
                {order.shipping_city}, {order.shipping_state} – {order.shipping_pin}
              </div>
            </div>
          </div>
        )
      })}
    </main>
  )
}
