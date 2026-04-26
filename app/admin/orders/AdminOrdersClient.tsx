'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatINR } from '@/lib/money'

',const STATUS_OPTIONS = [
  'paid',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
] as const

export default function AdminOrdersClient({
  orders,
  items,
}: {
  orders: any[]
  items: any[]
}) {
  const router = useRouter()

  const [statusState, setStatusState] = useState<Record<string, string>>({})

  // group items by order
  const itemsByOrder: Record<string, any[]> = {}
  items.forEach(item => {
    const key = String(item.order_id)
    if (!itemsByOrder[key]) itemsByOrder[key] = []
    itemsByOrder[key].push(item)
  })

  async function saveStatus(orderId: string) {
    const newStatus = statusState[orderId]
    if (!newStatus) return

    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      alert('Failed to update status')
      return
    }

    alert('Status updated ✅')
    router.refresh()
  }

  async function markPaid(orderId: string) {
    const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
    })

    if (!res.ok) {
      alert('Failed to update payment')
      return
    }

    alert('Payment marked as paid ✅')
    router.refresh()
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Orders</h1>

      {orders.map(order => {
        const orderItems = itemsByOrder[String(order.id)] || []
        const selectedStatus = statusState[order.id] ?? order.status

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
              Order Date:{' '}
              {new Date(order.created_at).toLocaleString('en-IN')}
            </div>

            <hr />

            {/* ITEMS */}
            {orderItems.map(item => (
              <div key={item.id}>
                {item.name} × {item.qty} —{' '}
                {formatINR(item.price * item.qty)}
              </div>
            ))}

            <hr />

            {/* TOTALS */}
            <div>Subtotal: {formatINR(order.subtotal)}</div>
            <div>Delivery: {formatINR(order.delivery_fee)}</div>
            <div>Discount: {formatINR(order.discount)}</div>
            <strong>Total: {formatINR(order.grand_total)}</strong>

            <hr />

            {/* STATUS UPDATE */}
            <label>Update Status</label>
            <br />
            <select
              value={selectedStatus}
              onChange={e =>
                setStatusState(prev => ({
                  ...prev,
                  [order.id]: e.target.value,
                }))
              }
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              onClick={() => saveStatus(order.id)}
              disabled={selectedStatus === order.status}
              style={{ marginLeft: 8 }}
            >
              Save Status
            </button>

            {/* PAYMENT */}
            {order.payment_status === 'cod_pending' && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => markPaid(order.id)}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                  }}
                >
                  Mark Payment as Paid
                </button>
              </div>
            )}

            <hr />

            {/* SHIPPING */}
            <h4>Shipping</h4>
            <div>
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
                {order.shipping_city}, {order.shipping_state} –{' '}
                {order.shipping_pin}
              </div>
            </div>
          </div>
        )
      })}
    </main>
  )
}
