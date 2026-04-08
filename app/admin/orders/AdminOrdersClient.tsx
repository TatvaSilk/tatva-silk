'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function formatINR(n?: number | null) {
  if (typeof n !== 'number') return '₹0.00'
  return `₹${(n / 100).toFixed(2)}`
}

const STATUS_OPTIONS = [
  'placed',
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

  // ✅ local editable state per order
  const [statusState, setStatusState] = useState<Record<string, string>>({})

  // group items by order
  const itemsByOrder: Record<string, any[]> = {}
  items.forEach((item) => {
    if (!itemsByOrder[item.order_id]) {
      itemsByOrder[item.order_id] = []
    }
    itemsByOrder[item.order_id].push(item)
  })

  async function saveStatus(orderId: string) {
    const newStatus = statusState[orderId]
    if (!newStatus) return

    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Failed to update status')
      return
    }

    alert('Status updated successfully ✅')
    router.refresh()
  }

  async function markPaid(orderId: string) {
    const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Payment update failed')
      return
    }

    alert('Payment marked as paid ✅')
    router.refresh()
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Orders</h1>

      {orders.map((order) => {
        const selectedStatus = statusState[order.id] ?? order.status

        return (
          <div
            key={order.id}
            style={{
              border: '1px solid #334155',
              borderRadius: 10,
              padding: 16,
              marginBottom: 24,
              background: '#020617',
              color: '#e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{order.order_no}</strong>
              <span>Status: {order.status}</span>
            </div>

            <hr />

            {(itemsByOrder[order.id] || []).map((item) => (
              <div key={item.id}>
                {item.name} × {item.qty} — {formatINR(item.line_total)}
              </div>
            ))}

            <hr />

            <div>Subtotal: {formatINR(order.subtotal)}</div>
            <div>Delivery: {formatINR(order.delivery_fee)}</div>
            <strong>Total: {formatINR(order.grand_total)}</strong>

            <hr />

            {/* ✅ STATUS SELECT */}
            <label style={{ display: 'block', marginBottom: 6 }}>
              Update Status
            </label>

            <select
              value={selectedStatus}
              onChange={(e) =>
                setStatusState((prev) => ({
                  ...prev,
                  [order.id]: e.target.value,
                }))
              }
              style={{
                background: '#020617',
                color: '#e5e7eb',
                border: '1px solid #334155',
                padding: '6px',
                borderRadius: 4,
                marginRight: 8,
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>

            {/* ✅ SAVE BUTTON */}
            <button
              onClick={() => saveStatus(order.id)}
              disabled={selectedStatus === order.status}
              style={{
                background:
                  selectedStatus === order.status ? '#374151' : '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                cursor:
                  selectedStatus === order.status
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              Save Status
            </button>

            {/* ✅ COD PAYMENT */}
            {order.payment_status === 'cod_pending' && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => markPaid(order.id)}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Mark Payment as Paid
                </button>
              </div>
            )}
          </div>
        )
      })}
    </main>
  )
}
