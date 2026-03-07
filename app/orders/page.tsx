'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

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
        // 1) Who is signed in?
        const { data: { user }, error: userErr } = await supabase.auth.getUser()
        if (userErr) throw userErr
        if (!user) {
          setEmail(null)
          setOrders(null)
          setLoading(false)
          return
        }
        setEmail(user.email ?? null)

        // 2) Fetch this user's orders (RLS should allow only own rows)
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, order_no, created_at, status, payment_status,
            items_count, subtotal, delivery_fee, discount, grand_total,
            shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
            shipping_city, shipping_state, shipping_pin
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders((data ?? []) as Order[])
      } catch (err: any) {
        setErrorMsg(err?.message ?? 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ——— Helpers ———
  // NOTE: If your amounts are already in rupees (not paise), remove "/ 100".
  function formatINR(n?: number | null) {
    if (typeof n !== 'number') return '₹0.00'
    return `₹${(n / 100).toFixed(2)}`
  }

  // ——— UI ———
  if (loading) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}><Link href="/account">← Back to Account</Link></div>
        <h1>Orders</h1>
        <p style={{ marginTop: 12 }}>Loading…</p>
      </main>
    )
  }

  if (!email) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}><Link href="/account">← Back to Account</Link></div>
        <h1>Orders</h1>
        <p style={{ marginTop: 12 }}>
          Please <Link href="/account" style={{ color: '#2563eb' }}>sign in</Link> to view your orders.
        </p>
      </main>
    )
  }

  if (errorMsg) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}><Link href="/account">← Back to Account</Link></div>
        <h1>Orders</h1>
        <p style={{ marginTop: 12, color: 'crimson' }}>{errorMsg}</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/account">← Back to Account</Link>
      </div>

      <h1>Orders</h1>
      <div style={{ color: '#666', marginTop: 6 }}>{email}</div>

      {!orders || orders.length === 0 ? (
        <p style={{ marginTop: 16 }}>No orders yet.</p>
      ) : (
        <ul style={{ marginTop: 16, display: 'grid', gap: 16 }}>
          {orders.map((o) => {
            return (
              <li
                key={o.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {o.order_no ? `Order ${o.order_no}` : `Order ${o.id.slice(0, 8).toUpperCase()}`}
                    </div>
                    <div style={{ color: '#666', fontSize: 13 }}>
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div><b>Status:</b> {o.status ?? '—'}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>
                      Payment: {o.payment_status ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
                  <div><b>Items:</b> {o.items_count ?? 0}</div>
                  <div><b>Subtotal:</b> {formatINR(o.subtotal)}</div>
                  <div><b>Delivery fee:</b> {formatINR(o.delivery_fee)}</div>
                  <div><b>Discount:</b> {formatINR(o.discount)}</div>
                  <div style={{ fontWeight: 700 }}>
                    <b>Total:</b> {formatINR(o.grand_total)}
                  </div>
                </div>

                {/* Shipping */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Shipping</div>
                  <div>{o.shipping_name ?? '—'} {o.shipping_phone ? `• ${o.shipping_phone}` : ''}</div>
                  <div>
                    {[o.shipping_address_line1, o.shipping_address_line2]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </div>
                  <div>
                    {[o.shipping_city, o.shipping_state, o.shipping_pin]
                      .filter(Boolean)
                      .join(', ') || ''}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
