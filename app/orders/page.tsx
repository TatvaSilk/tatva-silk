'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ========== TYPES (MATCH SUPABASE EXACTLY) ========== */

type ProductImage = {
  url: string
}

type Product = {
  product_images: ProductImage[]
}

type OrderItem = {
  id: string
  name: string
  price: number
  qty: number
  product_id: string
  product: Product[] | null   // ✅ MUST BE ARRAY
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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      const { data, error } = await supabase
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
            product_id,
            product:products (
              product_images ( url )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setOrders(data ?? [])   // ✅ NO CAST
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
        style={{ width: '100%', padding: 10, marginBottom: 20 }}
      />

      {filteredOrders.map(order => (
        <div key={order.id} style={{ border: '1px solid #ddd', marginBottom: 20 }}>
          {/* HEADER */}
          <div style={{ padding: 12, background: '#f3f4f6', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            <Header label="ORDER PLACED">
              {new Date(order.created_at).toLocaleDateString()}
            </Header>
            <Header label="TOTAL">₹{order.grand_total}</Header>
            <Header label="ORDER #">{order.order_no}</Header>
            <Header label="STATUS">{order.status}</Header>
          </div>

          {/* ITEMS */}
          {order.order_items.map(item => {
            const imageUrl =
              item.product?.[0]?.product_images?.[0]?.url ?? null

            return (
              <div key={item.id} style={{ display: 'flex', gap: 16, padding: 16 }}>
                {/* IMAGE */}
                <div style={{ width: 90, height: 90 }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: 'cover',
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    <div style={{ width: 90, height: 90, background: '#e5e7eb' }} />
                  )}
                </div>

                {/* DETAILS */}
                <div>
                  <strong>{item.name}</strong>
                  <div>₹{item.price} × {item.qty}</div>
                  <strong>₹{item.price * item.qty}</strong>

                  <div style={{ marginTop: 8 }}>
                    <Link href={`/orders/${order.id}`}>View order</Link>
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

/* ========== HELPERS ========== */

function Header({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <small style={{ color: '#6b7280' }}>{label}</small>
      <div>{children}</div>
    </div>
  )
}
