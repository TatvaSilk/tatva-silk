'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Order = {
  id: string
  order_no: string
  created_at: string
  grand_total: number
  status: string
  order_items: {
    id: string
    name: string
    price: number
    qty: number
    product_id: string
    image?: string
  }[]
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
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
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div style={{ padding: 20 }}>Loading orders…</div>
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Your Orders</h1>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map(order => (
        <div
          key={order.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 20,
            background: '#fff',
          }}
        >
          {/* ORDER HEADER */}
          <div
            style={{
              padding: 12,
              background: '#f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              rowGap: 8,
            }}
          >
            <div>
              <div style={label}>ORDER PLACED</div>
              <div>{new Date(order.created_at).toLocaleDateString()}</div>
            </div>

            <div>
              <div style={label}>TOTAL</div>
              <div>₹{order.grand_total}</div>
            </div>

            <div>
              <div style={label}>ORDER #</div>
              <div>{order.order_no}</div>
            </div>

            <div>
              <div style={label}>STATUS</div>
              <div style={{ textTransform: 'capitalize' }}>
                {order.status}
              </div>
            </div>
          </div>

          {/* ITEMS */}
          {order.order_items.map(item => (
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
              <div style={{ width: 90, height: 90, background: '#f9fafb' }}>
                <Image
                  src={item.image || '/placeholder.png'}
                  alt={item.name}
                  width={90}
                  height={90}
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {/* DETAILS */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ marginTop: 6 }}>
                  ₹{item.price} × {item.qty}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>
                    ₹{item.price * item.qty}
                  </strong>
                </div>

                <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                  <Link href={`/orders/${order.id}`}>
                    View order
                  </Link>

                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#2563eb',
                      cursor: 'pointer',
                    }}
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

/* ========= styles ========= */

const label: React.CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  marginBottom: 2,
}
