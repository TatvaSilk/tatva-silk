'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
  tracking_url?: string | null
  order_items: OrderItem[]
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function loadOrders() {
    setLoading(true)

    const { data: auth } = await supabase.auth.getUser()
    const email = auth?.user?.email

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
    const ordersData: Order[] = json.orders ?? []

    setOrders(ordersData)

    // ✅ Fetch images
    const productIds = [
      ...new Set(
        ordersData.flatMap(o => o.order_items).map(i => i.product_id)
      ),
    ]

    if (productIds.length) {
      const { data: imgs } = await supabase
        .from('product_images')
        .select('product_id, url')
        .in('product_id', productIds)

      const map: Record<string, string> = {}
      imgs?.forEach(i => {
        if (!map[i.product_id]) map[i.product_id] = i.url
      })
      setImages(map)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!search) return orders
    const q = search.toLowerCase()
    return orders.filter(o =>
      o.order_no.toLowerCase().includes(q) ||
      o.order_items.some(i => i.name.toLowerCase().includes(q))
    )
  }, [orders, search])

  async function cancelOrder(orderId: string) {
    if (!confirm('Cancel this order?')) return

    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'PATCH',
    })

    if (!res.ok) {
      alert('Cancel failed')
      return
    }

    alert('Order cancelled')
    loadOrders()
  }

  async function reorder(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/reorder`, {
      method: 'POST',
    })

    if (!res.ok) {
      alert('Reorder failed')
      return
    }

    router.push('/cart')
  }

  if (loading) return <div style={{ padding: 20 }}>Loading…</div>

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
        <div key={order.id} style={{ border: '1px solid #ddd', marginBottom: 20 }}>
          {/* HEADER */}
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

          {/* ITEMS */}
          {order.order_items.map(item => (
            <div
              key={item.id}
              style={{ display: 'flex', gap: 16, padding: 16 }}
            >
              <div style={{ width: 90, height: 90 }}>
                {images[item.product_id] ? (
                  <img
                    src={images[item.product_id]}
                    style={{ width: 90, height: 90, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{ width: 90, height: 90, background: '#e5e7eb' }}
                  />
                )}
              </div>

              <div>
                <strong>{item.name}</strong>
                <div>
                  ₹{item.price} × {item.qty}
                </div>
                <strong>₹{item.price * item.qty}</strong>

                {/* ACTIONS */}
                <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                  <Link href={`/orders/${order.id}`}>View order</Link>

                  <button
                    onClick={() =>
                      window.open(`/api/orders/${order.id}/invoice`)
                    }
                  >
                    Download invoice
                  </button>

                  {order.status === 'placed' && (
                    <button onClick={() => cancelOrder(order.id)}>
                      Cancel order
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <button onClick={() => reorder(order.id)}>Reorder</button>
                  )}

                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Track shipment
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </main>
  )
}
