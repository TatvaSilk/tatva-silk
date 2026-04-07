'use client'

function formatINR(n?: number | null) {
  if (typeof n !== 'number') return '₹0.00'
  return `₹${(n / 100).toFixed(2)}`
}

export default function AdminOrdersClient({
  orders,
  items,
}: {
  orders: any[]
  items: any[]
}) {
  const itemsByOrder: Record<string, any[]> = {}

  items.forEach(i => {
    if (!itemsByOrder[i.order_id]) {
      itemsByOrder[i.order_id] = []
    }
    itemsByOrder[i.order_id].push(i)
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
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{order.order_no}</strong>
            <span>Status: {order.status}</span>
          </div>

          <hr />

          {(itemsByOrder[order.id] || []).map(item => (
            <div key={item.id}>
              {item.name} × {item.qty} — {formatINR(item.line_total)}
            </div>
          ))}

          <hr />

          <div>Total: {formatINR(order.grand_total)}</div>

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
          >
            <option value="placed">Placed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {order.payment_status === 'cod_pending' && (
            <button
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
