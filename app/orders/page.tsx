'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ========== TYPES ========== */

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

/* ========== PAGE ========== */

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      /** 1️⃣ Load orders */
      const { data: ordersData, error } = await supabase
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        return
      }

      setOrders(ordersData ?? [])

      /** 2️⃣ Collect product IDs */
      const productIds = [
        ...new Set(
          ordersData
            ?.flatMap(o => o.order_items)
            .map(i => i.product_id)
        ),
      ]

      /** 3️⃣ Fetch images EXACTLY like Home */
      const { data: imageRows } = await supabase
        .from('product_images')
        .select('product_id, url')
        .in('product_id', productIds)

      /** 4️⃣ Map productId → image URL */
      const map: Record<string, string> = {}
      imageRows?.forEach(img => {
        if (!map[img.product_id]) {
          map[img.product_id] = img.url
        }
      })

      setImages(map)
      setLoading(false)
    }

    load()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!search) return orders
    const q = search.toLowerCase()
    return orders.filter(order =>
      order.order_no.toLowerCase().includes(q) ||
      order.order_items.some(item =>
        item.name.toLowerCase().includes(q)
      )
    )
  }, [orders, search])

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

      {filteredOrders.map(order => (
        <div key={order.id} style={{ border: '1px solid #ddd', marginBottom: 20 }}>
          {/* HEADER */}
          <div style={{ padding: 12, background: '#f3f4f6', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div>{new Date(order.created_at).toLocaleDateString()}</div>
            <div>₹{order.grand_total}</div>
            <div>{order.order_no}</div>
            <div>{order.status}</div>
          </div>

          {/* ITEMS */}
          {order.order_items.map(item => {
            const imageUrl = images[item.product_id]

            return (
              <div key={item.id} style={{ display: 'flex', gap: 16, padding: 16 }}>
                {/* IMAGE */}
                <div style={{ width: 90, height: 90 }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <div style={{ width: 90, height: 90, background: '#e5e7eb' }} />
                  )}
                </div>

                {/* DETAILS */}
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

                    <button
                      onClick={() => {
                        localStorage.setItem(
                          'cart',
                          JSON.stringify([{ productId: item.product_id, qty: item.qty }])
                        )
                        window.location.href = '/checkout'
                      }}
                      style={linkBtn}
                    >
                      Re‑order
                    </button>

                    <span style={{ color: '#6b7280' }}>Track order</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </main>
  )
}

const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
}
