'use client'

function formatINR(n?: number | null) {
  if (typeof n !== 'number') return '₹0.00'
  return `₹${(n / 100).toFixed(2)}`
}

/**
 * ✅ ENUM VALUES MUST MATCH DATABASE EXACTLY (lowercase)
 */
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
  const itemsByOrder: Record<string, any[]> = {}

  items.forEach((item) => {
    if (!itemsByOrder[item.order_id]) {
      itemsByOrder[item.order_id] = []
    }
    itemsByOrder[item.order_id].push(item)
  })

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Orders</h1>

      {orders.map((order) => (
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
          <div>Discount: {formatINR(order.discount)}</div>
          <strong>Total: {formatINR(order.grand_total)}</strong>

          <hr />

          <label style={{ display: 'block', marginBottom: 6 }}>
            Update Status
          </label>

          {/* ✅ value is lowercase, label is uppercase */}
          <select
            value={order.status}  // this is already lowercase from DB
            onChange={async (e) => {
              await fetch(`/api/admin/orders/${order.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: e.target.value }), // lowercase ✅
              })
              location.reload()
            }}
            style={{
              background: '#020617',
              color: '#e5e7eb',
              border: '1px solid #334155',
              padding: '6px',
              borderRadius: 4,
            }}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.toUpperCase()}
              </option>
            ))}
          </select>

          {order.payment_status === 'cod_pending' && (
            <button
              onClick={async () => {
                await fetch(`/api/admin/orders/${order.id}/payment`, {
                  method: 'PATCH',
                })
                location.reload()
              }}
              style={{
                marginTop: 12,
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
          )}
        </div>
      ))}
    </main>
  )
}
``
