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
  tracking_url?: string | null
  invoice_no?: string | null
  order_items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // 1️⃣ get logged-in user
      const { data: auth } = await supabase.auth.getUser()
      const email = auth?.user?.email
      if (!email) {
        setLoading(false)
        return
      }

      // 2️⃣ get phone from customer_profiles
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('phone')
        .eq('email', email)
        .single()

      if (!profile?.phone) {
        console.error('Customer phone not found')
        setLoading(false)
        return
      }

      // 3️⃣ fetch orders
      const res = await fetch('/api/orders/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profile.phone }),
      })

      const json = await res.json()
      const ordersData: Order[] = json.orders ?? []
      setOrders(ordersData)

      // 4️⃣ fetch images
      const productIds = [
        ...new Set(
          ordersData.flatMap(o => o.order_items).map(i => i.product_id)
        ),
      ]

      if (productIds.length) {
        const { data } = await supabase
          .from('product_images')
          .select('product_id, url')
          .in('product_id', productIds)

        const map: Record<string, string> = {}
        data?.forEach(i => {
          if (!map[i.product_id]) map[i.product_id] = i.url
        })
        setImages(map)
      }

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

  async function cancelOrder(orderId: string) {
    if (!confirm('Cancel this order?')) return
    await fetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' })
    location.reload()
  }

  async function reorder(orderId: string) {
    await fetch(`/api/orders/${orderId}/reorder`, { method: 'POST' })
    location.href = '/cart'
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
              <img
                src={images[item.product_id] || ''}
                alt={item.name}
                style={{ width: 90, height: 90, objectFit: 'cover' }}
              />

              <div>
                <strong>{item.name}</strong>
                <div>₹{item.price} × {item.qty}</div>
                <strong>₹{item.price * item.qty}</strong>

                <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                  <Link href={`/orders/${order.id}`}>View</Link>

                  {order.invoice_no && (
                    <button
                      onClick={() =>
                        window.open(`/api/orders/${order.id}/invoice`)
                      }
                    >
                      Invoice
                    </button>
                  )}

                  {(order.status === 'placed' || order.status === 'paid') && (
                    <button onClick={() => cancelOrder(order.id)}>
                      Cancel
                    </button>
                  )}

                  {(order.status === 'delivered' ||
                    order.status === 'cancelled') && (
                    <button onClick={() => reorder(order.id)}>
                      Reorder
                    </button>
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
