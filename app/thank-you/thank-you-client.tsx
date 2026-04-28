'use client'

import { useEffect, useState } from 'react'
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

  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!orderNo) return

    const loadOrderAndSendWhatsapp = async () => {
      // ✅ fetch order by order_no
      const { data } = await supabase
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

      if (!data) return

      setOrder(data)

      // ✅ auto open WhatsApp
      sendInvoiceOnWhatsApp({
        phone: data.shipping_phone,
        orderId: data.id,
        invoiceNo: data.invoice_no,
        amount: data.grand_total,
      })

      // ✅ redirect after 5 sec
      setTimeout(() => {
        window.location.href = '/'
      }, 5000)
    }

    loadOrderAndSendWhatsapp()
  }, [orderNo])

  return (
    <main style={{ textAlign: 'center', padding: 80 }}>
      <h1>✅ Thank you</h1>
      <p>Your order has been placed successfully.</p>

      {orderNo && <h3>Order No: {orderNo}</h3>}

      <p>WhatsApp invoice is opening…</p>
      <p>You will be redirected to home page shortly.</p>
    </main>
  )
}
