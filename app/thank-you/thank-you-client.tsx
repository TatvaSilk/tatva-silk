'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { sendInvoiceOnWhatsApp } from '@/utils/whatsapp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ThankYouClient() {
  const params = useSearchParams()
  const orderNo = params.get('order')

  // ✅ prevents double execution
  const sentRef = useRef(false)

  useEffect(() => {
    if (!orderNo || sentRef.current) return
    sentRef.current = true

    const run = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_no,
          invoice_no,
          grand_total,
          shipping_phone
        `)
        .eq('order_no', orderNo)
        .single()

      if (error || !data) return

      sendInvoiceOnWhatsApp({
        phone: data.shipping_phone,
        orderId: data.id,
        invoiceNo: data.invoice_no,
        amount: data.grand_total,
      })

      setTimeout(() => {
        window.location.href = '/'
      }, 5000)
    }

    run()
  }, [orderNo])

  return (
    <main style={{ textAlign: 'center', padding: 80 }}>
      <h1>✅ Thank you</h1>
      <p>Your order has been placed successfully.</p>
      <h3>Order No: {orderNo}</h3>
      <p>WhatsApp invoice is opening…</p>
      <p>You will be redirected to home page shortly.</p>
    </main>
  )
}
