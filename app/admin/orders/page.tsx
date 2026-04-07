export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

function formatINR(n?: number | null) {
  if (typeof n !== 'number') return '₹0.00'
  return `₹${(n / 100).toFixed(2)}`
}

export default async function AdminOrdersPage() {
  // ✅ HARD CHECK so we SEE the error instead of crashing
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Admin Orders</h1>
        <p style={{ color: 'crimson' }}>
          SUPABASE_SERVICE_ROLE_KEY is missing in Vercel.
        </p>
      </div>
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_no, grand_total')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Admin Orders</h1>
        <p style={{ color: 'crimson' }}>{error.message}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Orders</h1>

      {data?.map(order => (
        <div
          key={order.id}
          style={{
            border: '1px solid #ddd',
            padding: 12,
            marginBottom: 8,
          }}
        >
          <div>{order.order_no}</div>
          <div>Total: {formatINR(order.grand_total)}</div>
        </div>
      ))}
    </div>
  )
}
