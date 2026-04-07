'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

type OrderItem = {
  id: string
  name: string
  price: number
  qty: number
}

type Order = {
  id: string
  order_no: string | null
  created_at: string
  status: string | null
  payment_status: string | null
  items_count: number | null
  subtotal: number | null
  delivery_fee: number | null
  discount: number | null
  grand_total: number | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pin: string | null
  order_items: OrderItem[]
}

export default function OrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [email, setEmail] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser()
        if (userErr) throw userErr

        if (!user) {
          setEmail(null)
          setOrders(null)
          setLoading(false)
          return
        }

        setEmail(user.email ?? null)

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, order_no, created_at, status, payment_status,
            items_count, subtotal, delivery_fee, discount, grand_total,
            shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
            shipping_city, shipping_state, shipping_pin,
            order_items (
              id,
              name,
              price,
              qty
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data as Order[])
      } catch (err: any) {
        setErrorMsg(err?.message ?? 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function formatINR(n?: number | null) {
    if (typeof n !== 'number') return '₹0.00'
    return `₹${(n / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <Link href="/account">← Back to Account</Link>
        <h1>Orders</h1>
        <p>Loading…</p>
      </main>
    )
  }

  if (!email) {
    return (
      <main style={{ padding: 40 }}>
        <Link href="/account">← Back to Account</Link>
        <h1>Orders</h1>
        <p>Please sign in to view your orders.</p>
      </main>
    )
  }

  if (errorMsg) {
    return (
      <main style={{ padding: 40 }}>
        <Link href="/account">← Back to Account</Link>
        <h1>Orders</h1>
        <p style={{ color: 'crimson' }}>{errorMsg}</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 40, maxWidth: 1080, margin: '0 auto' }}>
      <Link href="/account">← Back to Account</Link>

      <h1>My Orders</h1>
      <div style={{ color: '#666', marginBottom: 16 }}>{email}</div>

      {!orders || orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul style={{ display: 'grid', gap: 16 }}>
          {orders.map((o) => (
            <li
              key={o.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{o.order_no}</strong>
                <span>Status: {o.status}</span>
              </div>

              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {new Date(o.created_at).toLocaleString()}
              </div>

              <hr style={{ margin: '10px 0' }} />

              {/* ✅ PRODUCT ITEMS */}
              <div>
                {o.order_items.map(item => (
                  <div key={item.id}>
                    {item.name} × {item.qty} — {formatINR(item.price * item.qty)}
                  </div>
                ))}
              </div>

              <hr style={{ margin: '10px 0' }} />

              {/* ✅ TOTALS */}
              <div>Subtotal: {formatINR(o.subtotal)}</div>
              <div>Delivery: {formatINR(o.delivery_fee)}</div>
              <div>Discount: {formatINR(o.discount)}</div>
              <strong>Total: {formatINR(o.grand_total)}</strong>

              <hr style={{ margin: '10px 0' }} />

              {/* ✅ SHIPPING */}
              <div>
                <strong>Shipping</strong>
                <div>{o.shipping_name} • {o.shipping_phone}</div>
                <div>
                  {[o.shipping_address_line1, o.shipping_address_line2]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                <div>
                  {[o.shipping_city, o.shipping_state, o.shipping_pin]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
