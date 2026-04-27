'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ================= TYPES ================= */

type ProductImage = {
  url: string
  sort_order: number
}

type OrderItem = {
  id: string
  name: string
  price: number
  qty: number
  product_id: string
  product_images: ProductImage[]
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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadOrders() {
      // 1. Logged-in auth user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage('Please login to view your orders.')
        setLoading(false)
        return
      }

      // 2. Find customer profile using EMAIL (this matches your data)
      const { data: customer } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!customer) {
        setMessage('Customer profile not found.')
        setLoading(false)
        return
      }

      // 3. Fetch orders for this customer
      const { data: ordersData } = await supabase
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
            product_images:product_images (
              url,
              sort_order
            )
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      setOrders(ordersData ?? [])
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
        style={searchBox}
      />

      {orders.length === 0 && (
        <p>{message || 'No orders found.'}</p>
      )}

      {filteredOrders.map(order => (
        <div key={order.id} style={orderCard}>
          <div style={headerGrid}>
            <Header label="ORDER PLACED">
              {new Date(order.created_at).toLocaleDateString()}
            </Header>
            <Header label="TOTAL">₹{order.grand_total}</Header>
            <Header label="ORDER #">{order.order_no}</Header>
            <Header label="STATUS">{order.status}</Header>
          </div>

          {order.order_items.map(item => {
            const imageUrl =
              item.product_images
                .sort((a, b) => a.sort_order - b.sort_order)[0]
                ?.url

            return (
              <div key={item.id} style={itemRow}>
                <div style={{ width: 90, height: 90, position: 'relative' }}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <div style={imgPlaceholder} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div>₹{item.price} × {item.qty}</div>
                  <strong>₹{item.price * item.qty}</strong>

                  <div style={actionsRow}>
                    <Link href={`/orders/${order.id}`}>View order</Link>
                    <button style={linkBtn}>Download invoice</button>
                    <button style={linkBtn}>Re‑order</button>
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

/* ================= UI ================= */

function Header({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={headerLabel}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

const searchBox = {
  width: '100%',
  padding: 10,
  marginBottom: 20,
}

const orderCard = {
  border: '1px solid #ddd',
  borderRadius: 8,
  marginBottom: 20,
  background: '#fff',
}

const headerGrid = {
  padding: 12,
  background: '#f3f4f6',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
}

const itemRow = {
  display: 'flex',
  gap: 16,
  padding: 16,
  borderTop: '1px solid #eee',
}

const actionsRow = {
  display: 'flex',
  gap: 16,
  marginTop: 10,
}

const headerLabel = {
  fontSize: 11,
  color: '#6b7280',
}

const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
}

const imgPlaceholder = {
  width: 90,
  height: 90,
  background: '#e5e7eb',
  borderRadius: 6,
}
