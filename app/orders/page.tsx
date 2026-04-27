'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ========= TYPES ========= */

type ProductImage = {
  url: string
}

type ProductJoin = {
  product_images: ProductImage[]
}

type OrderItem = {
  id: string
  name: string
  price: number
  qty: number
  product_id: string
  product: ProductJoin[] | null
}

type Order = {
  id: string
  order_no: string
  created_at: string
  grand_total: number
  status: string
  customer_id: string
  order_items: OrderItem[]
}

/* ========= PAGE ========= */

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setOrders([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('orders')
        .select(`
          id,
          order_no,
          created_at,
          grand_total,
          status,
          customer_id,
          order_items (
            id,
            name,
            price,
            qty,
            product_id,
            product:products (
              product_images ( url, sort_order )
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      setOrders(data ?? [])
      setLoading(false)
    }

    loadOrders()
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

  if (loading) {
    return <div style={{ padding: 20 }}>Loading orders…</div>
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 26, marginBottom: 12 }}>Your Orders</h1>

      <input
        placeholder="Search by order number or product name"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 20,
          borderRadius: 6,
          border: '1px solid #ccc',
        }}
      />

      {filteredOrders.length === 0 && <p>No orders found.</p>}

      {filteredOrders.map(order => (
        <div
          key={order.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 20,
            background: '#fff',
          }}
        >
          <div
            style={{
              padding: 12,
              background: '#f3f4f6',
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              fontSize: 13,
            }}
          >
            <Header label="ORDER PLACED">
              {new Date(order.created_at).toLocaleDateString()}
            </Header>
            <Header label="TOTAL">₹{order.grand_total}</Header>
            <Header label="ORDER #">{order.order_no}</Header>
            <Header label="STATUS">{order.status}</Header>
          </div>

          {order.order_items.map(item => {
            const imageUrl =
              item.product?.[0]?.product_images?.[0]?.url || null

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: 16,
                  borderTop: '1px solid #eee',
                }}
              >
                <div style={{ width: 90, height: 90 }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      width={90}
                      height={90}
                      style={{ borderRadius: 6, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        background: '#e5e7eb',
                        borderRadius: 6,
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div>₹{item.price} × {item.qty}</div>
                  <strong>₹{item.price * item.qty}</strong>

                  <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                    <Link href={`/orders/${order.id}`}>View order</Link>

                    <button
                      style={btnStyle}
                      onClick={() =>
                        window.open(`/api/orders/${order.id}/invoice`)
                      }
                    >
                      Download invoice
                    </button>

                    <button
                      style={btnStyle}
                      onClick={() => {
                        const cart = JSON.parse(
                          localStorage.getItem('cart') || '[]'
                        )
                        cart.push({
                          productId: item.product_id,
                          qty: item.qty,
                        })
                        localStorage.setItem('cart', JSON.stringify(cart))
                        window.location.href = '/checkout'
                      }}
                    >
                      Re‑order
                    </button>
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

function Header({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#2563eb',
  cursor: 'pointer',
}
