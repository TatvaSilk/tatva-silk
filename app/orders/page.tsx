// app/orders/page.tsx
import Link from 'next/link'

export default async function OrdersPage() {
  // We’ll add real, authenticated order listing later.
  // For now, just show a friendly placeholder so navigation doesn’t 404.

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/account">← Back to Account</Link>
      </div>

      <h1>Orders</h1>

      <p style={{ color: '#666', marginTop: 12 }}>
        Your orders will appear here after you sign in and place an order.
      </p>

      <div style={{ marginTop: 16 }}>
        <Link href="/account" style={{ color: '#2563eb' }}>
          Go to Account →
        </Link>
      </div>
    </main>
  )
}
``
