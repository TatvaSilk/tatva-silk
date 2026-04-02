'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ThankYouClient() {
  const params = useSearchParams()
  const orderNo = params.get('order')

  useEffect(() => {
    setTimeout(() => {
      window.location.href = '/'
    }, 5000)
  }, [])

  return (
    <main style={{ textAlign: 'center', padding: 80 }}>
      <h1>✅ Thank you</h1>
      <p>Your order has been placed successfully.</p>
      <h3>Order No: {orderNo}</h3>
      <p>You will be redirected to home page shortly.</p>
    </main>
  )
}
