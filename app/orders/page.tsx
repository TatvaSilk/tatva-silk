'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

type Order = {
  id: string
  created_at: string
  status: string
  total_cents: number
  currency: string
}

export default function OrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return } // not signed in
      setEmail(user.email ?? null)
      const { data } = await supabase
        .from('orders')
        .select('id, created_at, status, total_cents, currency')
        .order('created_at', { ascending: false })
      setOrders(data as any)
      setLoading(false)
    })()
  }, [])

  if (loading) return <main style={{ padding: 40 }}>Loading…</main>

  if (!orders) {
    return (
      <main style={{ padding: 40 }}>
        <div style={{ marginBottom: 12 }}>/account← Back to Account</Link></div>
        <h1>Orders</h1>
        <p>You are not signed in. /accountGo to Account</Link></p>
      </main>
    )
  }

  return (
    <main style={{ padding: 40 }}>
      <div style={{ marginBottom: 12 }}>/account← Back to Account</Link></div>
      <h1>Orders</h1>
      <div style={{ color: '#666', marginTop: 6 }}>{email}</div>

      {orders.length === 0 ? (
        <p style={{ marginTop: 16 }}>No orders yet.</p>
      ) : (
        <ul style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {orders.map(o => (
            <li key={o.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div><b>Order:</b> {o.id}</div>
              <div><b>Date:</b> {new Date(o.created_at).toLocaleString()}</div>
              <div><b>Status:</b> {o.status}</div>
              <div><b>Total:</b> ₹{(o.total_cents / 100).toFixed(2)}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
