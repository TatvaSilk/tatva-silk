'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ThankYouClient() {
  const params = useSearchParams()
  const orderNo = params.get('order')

  const ranRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(15)

  useEffect(() => {
    if (!orderNo || ranRef.current) return
    ranRef.current = true

    const run = async () => {
      // ✅ Fetch order safely via API
      const res = await fetch('/api/orders/by-order-no', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Order not found')
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

      // ✅ Open WhatsApp in new tab
      const link = document.createElement('a')
      link.href = `https://wa.me/91${phone}?text=${message}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // ✅ Countdown timer
      const interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            window.location.href = '/'
            return 0
          }
          return prev - 1
        })
      }, 1000)
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
      <p>WhatsApp opened in a new tab.</p>
      <p>
        Redirecting to home page in <strong>{secondsLeft}</strong> seconds…
      </p>
    </main>
  )
}
