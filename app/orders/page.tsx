'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      const { data, error } = await supabase
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
            product_images (
              url,
              sort_order
            )
          )
        `)
        .order('created_at', { ascending: false })

      console.log('ORDERS DATA:', data)
      console.log('ERROR:', error)

      setOrders(data ?? [])
      setLoading(false)
    }

    loadOrders()
  }, [])

  if (loading) return <div style={{ padding: 20 }}>Loading…</div>

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <h1>Your Orders (Debug Mode)</h1>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map(order => (
        <div
          key={order.id}
          style={{
            border: '1px solid #ddd',
            marginBottom: 20,
            padding: 12,
          }}
        >
          <p><strong>Order No:</strong> {order.order_no}</p>
          <p><strong>Customer ID:</strong> {order.customer_id}</p>

          {order.order_items.map((item: any) => {
            const image =
              item.product_images
                ?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
                ?.url

            return (
              <div key={item.id} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 80, height: 80, position: 'relative' }}>
                  {image && (
                    <Image
                      src={image}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                </div>

                <div>
                  <div>{item.name}</div>
                  <div>₹{item.price} × {item.qty}</div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </main>
  )
}
