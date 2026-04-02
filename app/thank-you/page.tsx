'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ThankYouPage() {
  const params = useSearchParams()
  const orderNo = params.get('order')
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setSeconds((s) => s - 1)
    }, 1000)

    // Redirect to home after 5 seconds
    const redirect = setTimeout(() => {
      window.location.href = '/'
    }, 5000)

    return () => {
      clearInterval(timer)
      clearTimeout(redirect)
    }
  }, [])

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      {/* ✅ Success icon */}
      <div
        style={{
          fontSize: 64,
          marginBottom: 16,
        }}
      >
        ✅
      </div>

      <h1 style={{ marginBottom: 8 }}>Thank you for your order!</h1>

      <p style={{ fontSize: 18, marginBottom: 16 }}>
        Your order has been placed successfully.
      </p>

      {orderNo && (
        <div
          style={{
            display: 'inline-block',
            padding: '10px 14px',
            borderRadius: 8,
            background: '#f3f4f6',
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          Order No: {orderNo}
        </div>
      )}

      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        You will be redirected to the home page in{' '}
        <strong>{seconds}</strong> seconds.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            background: '#f59e0b',
            padding: '10px 16px',
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: 'none',
            color: '#111',
          }}
        >
          Go to Home
        </Link>

        <Link
          href="/orders"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontWeight: 600,
            textDecoration: 'none',
            color: '#111',
          }}
        >
          View Orders
        </Link>
      </div>
    </main>
  )
}
