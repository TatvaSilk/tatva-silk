'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type OrderItem = {
  id: string
  name: string
  price: number
  qty: number
  product_id: string
}

type Order = {
  id: string
  order_no: string
  created_at: string
  grand_total: number
  status: string
  order_items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data } = await supabase.auth.getUser()
      const email = data?.user?.email

      if (!email) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/orders/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email }),
      })

      const json = await res.json()
      setOrders(json.orders ?? [])
      setLoading(false)
    }

    load()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!search) return orders
    const q = search.toLowerCase()
    return orders.filter(
      o =>
        o.order_no.toLowerCase().includes(q) ||
        o.order_items.some(i => i.name.toLowerCase().includes(q))
    )
  }, [orders, search])

  if (loading) {
    return <div style={{ padding: 20 }}>Loading…</div>
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <h1>Your Orders</h1>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search orders"
        style={{ width: '100%', padding: 10, marginBottom: 20 }}
      />

      {filteredOrders.length === 0 && <p>No orders found.</p>}

      {filteredOrders.map(order => (
        <div
          key={order.id}
          style={{ border: '1px solid #ddd', marginBottom: 20 }}
        >
          <div
            style={{
              padding: 12,
              background: '#f3f4f6',
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
            }}
          >
            <div>{new Date(order.created_at).toLocaleDateString()}</div>
            <div>₹{order.grand_total}</div>
            <div>{order.order_no}</div>
            <div>{order.status}</div>
          </div>

          {order.order_items.map(item => (
            <div
              key={item.id}
              style={{ display: 'flex', gap: 16, padding: 16 }}
            >
              <div>
                <strong>{item.name}</strong>
                <div>
                  ₹{item.price} × {item.qty}
                </div>
                <strong>₹{item.price * item.qty}</strong>

                <div style={{ marginTop: 8 }}>
                  <Link href={`/orders/${order.id}`}>View order</Link>{' '}
                  <button
                    onClick={() =>
                      window.open(`/api/orders/${order.id}/invoice`)
                    }
                  >
                    Download invoice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </main>
  )
}
