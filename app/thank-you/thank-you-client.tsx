'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ThankYouClient() {
  const params = useSearchParams()
  const orderNo = params.get('order')
  const ranRef = useRef(false)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderNo || ranRef.current) return
    ranRef.current = true

    const run = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, invoice_no, grand_total, shipping_phone')
        .eq('order_no', orderNo)
        .single()

      // ✅ Handle missing order
      if (error || !data) {
        setError('Order not found. Please contact support.')
        return
      }

      const phone = data.shipping_phone.replace(/\D/g, '')
      const message = encodeURIComponent(
`Thank you for shopping with Tatva Silk 🙏

🧾 Invoice No: ${data.invoice_no}
💰 Amount: ₹${data.grand_total}

Download your invoice:
https://tatva-silk.vercel.app/api/orders/${data.id}/invoice`
      )

      // ✅ Redirect to WhatsApp (allowed)
      window.location.href = `https://wa.me/91${phone}?text=${message}`
    }

    run()
  }, [orderNo])

  if (error) {
    return (
      <main style={{ textAlign: 'center', padding: 80 }}>
        <h1>⚠️ Order Issue</h1>
        <p>{error}</p>
      </main>
    )
  }

  return (
    <main style={{ textAlign: 'center', padding: 80 }}>
      <h1>✅ Thank you</h1>
      <p>Your order has been placed successfully.</p>
      <h3>Order No: {orderNo}</h3>
      <p>Redirecting to WhatsApp…</p>
    </main>
  )
}
``
