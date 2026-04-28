'use client''use client, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ================= TYPES ================= */

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

/* ================= PAGE ================= */

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        /* ✅ Logged‑in user */
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const email = user.email ?? ''
        const phone =
          user.phone ??
          (user.user_metadata?.phone as string | undefined) ??
          ''

        /* ✅ Fetch ALL matching customer profiles (email OR phone) */
        const { data: profiles, error: profileErr } = await supabase
          .from('customer_profiles')
          .select('id')
          .or(`email.eq.${email},phone.eq.${phone}`)

        if (profileErr) {
          setError(profileErr.message)
          setLoading(false)
          return
        }

        if (!profiles || profiles.length === 0) {
          setLoading(false)
          return
        }

        const profileIds = profiles.map(p => p.id)

        /* ✅ Fetch orders for ALL matching profiles */
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select(`
            id,
            order_no,
            created_at,
            grand_total,
            status,
            order_items (
              id,
              name,
              price,
              qty,
              product_id
            )
          `)
          .in('customer_id', profileIds)
          .order('created_at', { ascending: false })

        if (ordersErr) {
          setError(ordersErr.message)
          setLoading(false)
          return
        }

        setOrders(ordersData ?? [])

        /* ✅ Load product images */
        const productIds = [
          ...new Set(
            ordersData
              ?.flatMap(o => o.order_items)
              .map(i => i.product_id)
          ),
        ]

        if (productIds.length > 0) {
          const { data: imageRows } = await supabase
            .from('product_images')
            .select('product_id, url')
            .in('product_id', productIds)

          const map: Record<string, string> = {}
          imageRows?.forEach(img => {
            if (!map[img.product_id]) map[img.product_id] = img.url
          })
          setImages(map)
        }

        setLoading(false)
      } catch (e: any) {
        setError(e.message)
        setLoading(false)
      }
    }

    load()
  }, [])

  /* ✅ Cancel order */
  async function cancelOrder(orderId: string) {
    const ok = confirm('Are you sure you want to cancel this order?')
    if (!ok) return

    await fetch('/api/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })

    setOrders(o =>
      o.map(ord =>
        ord.id === orderId ? { ...ord, status: 'cancelled' } : ord
      )
    )
  }

  const filteredOrders = useMemo(() => {
    if (!search) return orders
    const q = search.toLowerCase()
    return orders.filter(o =>
      o.order_no.toLowerCase().includes(q) ||
      o.order_items.some(i => i.name.toLowerCase().includes(q))
    )
  }, [orders, search])

  if (loading) return <div style={{ padding: 20 }}>Loading…</div>
  if (error) return <div style={{ padding: 20, color: 'crimson' }}>{error}</div>

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
            <div key={item.id} style={{ display: 'flex', gap: 16, padding: 16 }}>
              <div style={{ width: 90, height: 90 }}>
                {images[item.product_id] ? (
                  <img
                    src={images[item.product_id]}
                    alt={item.name}
                    style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <div style={{ width: 90, height: 90, background: '#e5e7eb' }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <strong>{item.name}</strong>
                <div>₹{item.price} × {item.qty}</div>
                <strong>₹{item.price * item.qty}</strong>

                <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                  <Link href={`/orders/${order.id}`}>View order</Link>

                  <button
                    onClick={() => window.open(`/api/orders/${order.id}/invoice`)}
                    style={linkBtn}
                  >
                    Download invoice
                  </button>

                  {order.status === 'placed' && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      style={cancelBtn}
                    >
                      Cancel order
                    </button>
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

/* ================= STYLES ================= */

const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
}

const cancelBtn = {
  background: 'none',
  border: 'none',
  color: '#dc2626',
  cursor: 'pointer',
  fontWeight: 600,
}
