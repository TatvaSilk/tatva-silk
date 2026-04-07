import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** ✅ Money formatter (paise → rupees) */
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
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Orders</h1>
        <p style={{ color: '#f87171' }}>{error.message}</p>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Orders</h1>
        <p>No orders found.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ marginBottom: 20 }}>Orders</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: '1px solid #334155',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            background: '#020617',
            color: '#e2e8f0',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{order.order_no}</strong>
            <span>Status: {order.status}</span>
          </div>

          {/* Status dropdown */}
          <div style={row}>
            <span>Status</span>
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
                borderRadius: 4,
              }}
            >
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment */}
          <div style={row}>
            <span>Payment</span>
            <span>{order.payment_status}</span>
          </div>

          {/* ✅ PRICE FIXED */}
          <div style={row}>
            <span>Total</span>
            <span>{formatINR(order.grand_total)}</span>
          </div>

          <hr style={{ borderColor: '#1f2937', margin: '12px 0' }} />

          {/* Shipping */}
          <div>
            <strong>Customer:</strong> {order.shipping_name}<br />
            <strong>Phone:</strong> {order.shipping_phone}<br />
            <strong>Address:</strong>{' '}
            {[order.shipping_address_line1, order.shipping_city, order.shipping_state, order.shipping_pin]
              .filter(Boolean)
              .join(', ')}
          </div>

          {/* COD confirm */}
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
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Mark Payment as Paid
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

const row: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 6,
}
