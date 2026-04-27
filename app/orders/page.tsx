'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
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
  product: {
    product_images: { url: string }[]
  } | null
}

type Order = {
  id: string
  order_no: string
  status: string
  created_at: string
  grand_total: number
  order_items: OrderItem[]
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    supabase
      .from('orders')
      .select(`
        id,
        order_no,
        status,
        created_at,
        grand_total,
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
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [])

  const filteredOrders = useMemo(() => {
    if (!query) return orders
    return orders.filter(o =>
      o.order_no.toLowerCase().includes(query.toLowerCase()) ||
      o.order_items.some(i =>
        i.name.toLowerCase().includes(query.toLowerCase())
      )
    )
  }, [orders, query])

  if (loading) {
    return <div style={{ padding: 20 }}>Loading your orders…</div>
  }

  return (
    <main style={{ maxWidth: 1050, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 26, marginBottom: 12 }}>Your Orders</h1>

      {/* SEARCH */}
      <input
        placeholder="Search by order number or product name"
        value={query}
        onChange={e => setQuery(e.target.value)}
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
          {/* HEADER */}
          <div
            style={{
              padding: 12,
              background: '#f3f4f6',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              fontSize: 13,
            }}
          >
            <HeaderCell label="ORDER PLACED">
              {new Date(order.created_at).toLocaleDateString()}
            </HeaderCell>

            <HeaderCell label="TOTAL">
              ₹{order.grand_total}
            </HeaderCell>

            <HeaderCell label="ORDER #">
              {order.order_no}
            </HeaderCell>

            <HeaderCell label="STATUS">
              {order.status}
            </HeaderCell>
          </div>

          {/* ITEMS */}
          {order.order_items.map(item => {
            const image =
              item.product?.product_images?.[0]?.url

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
                {/* IMAGE */}
                <div style={{ width: 90, height: 90 }}>
                  {image ? (
                    <Image
                      src={image}
                      alt={item.name}
                      width={90}
                      height={90}
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        background: '#f1f5f9',
                      }}
                    />
                  )}
                </div>

                {/* DETAILS */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {item.name}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    ₹{item.price} × {item.qty}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <strong>₹{item.price * item.qty}</strong>
                  </div>

                  {/* ACTIONS */}
                  <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                    {`/orders/${order.id}`}
                      View order
                    </Link>

                    <button
                      onClick={() => downloadInvoice(order.id)}
                      style={linkBtn}
                    >
                      📄 Download invoice
                    </button>

                    <button
                      onClick={() => reorder(item)}
                      style={linkBtn}
                    >
                      🔁 Re‑order
                    </button>

                    <span style={{ color: '#6b7280' }}>
                      📦 Track order
                    </span>
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

function HeaderCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#2563eb',
  cursor: 'pointer',
}

/* ========== ACTIONS ========== */

// ✅ INVOICE (stub for PDF API)
function downloadInvoice(orderId: string) {
  window.open(`/api/orders/${orderId}/invoice`, '_blank')
}

// ✅ RE‑ORDER (adds product back to cart)
function reorder(item: OrderItem) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  cart.push({
    productId: item.product_id,
    qty: item.qty,
  })
  localStorage.setItem('cart', JSON.stringify(cart))
  window.location.href = '/checkout'
}
