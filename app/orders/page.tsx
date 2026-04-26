'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { formatINR } from '@/lib/money'

type OrderItem = {
  id: string
  name: string
  price: number // ✅ price in paise
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

  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return setLoading(false)

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, order_no, created_at, status, payment_status,
            items_count, subtotal, delivery_fee, discount, grand_total,
            shipping_name, shipping_phone, shipping_address_line1,
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
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>
  if (errorMsg) return <p style={{ padding: 40, color: 'crimson' }}>{errorMsg}</p>

  return (
    <main style={{ padding: 40 }}>
      <Link href="/account">← Back</Link>
      <h1>My Orders</h1>

      {!orders?.length ? (
        <p>No orders yet.</p>
      ) : (
        <ul style={{ display: 'grid', gap: 16 }}>
          {orders.map(o => (
            <li key={o.id} style={{ border: '1px solid #e5e7eb', padding: 16 }}>
              <strong>{o.order_no}</strong>
              <div>{new Date(o.created_at).toLocaleString('en-IN')}</div>

              <hr />

              {o.order_items.map(i => (
                <div key={i.id}>
                  {i.name} × {i.qty} — {formatINR(i.price * i.qty)}
                </div>
              ))}

              <hr />

              <div>Subtotal: {formatINR(o.subtotal)}</div>
              <div>Delivery: {formatINR(o.delivery_fee)}</div>
              <div>Discount: {formatINR(o.discount)}</div>
              <strong>Total: {formatINR(o.grand_total)}</strong>

              <hr />

              <div>
                <strong>Shipping</strong>
                <div>{o.shipping_name} • {o.shipping_phone}</div>
                <div>{o.shipping_address_line1}</div>
                <div>{o.shipping_city}, {o.shipping_state} – {o.shipping_pin}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
``
