'use client'

import { useState, useTransition } from 'react'

export default function AddToCart({
  productId,
  inStock,
  variantId,
}: {
  productId: string
  inStock: boolean
  variantId?: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [qty, setQty] = useState(1)

  function add() {
    if (!inStock) return
    startTransition(async () => {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, variantId, qty }),
      })
      // TODO: show a toast if you like
    })
  }

  async function buyNow() {
    add()
    // Navigate to checkout (implement /checkout later if not ready)
    window.location.href = '/checkout'
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <label style={{ fontSize: 14 }}>Qty</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          style={{ width: 72, border: '1px solid #ddd', borderRadius: 6, padding: '6px 8px' }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button
          onClick={add}
          disabled={!inStock || pending}
          style={{
            background: '#000',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 6,
            opacity: !inStock || pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Adding…' : 'Add to Cart'}
        </button>

        <button
          onClick={buyNow}
          disabled={!inStock || pending}
          style={{
            background: '#d97706',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 6,
            opacity: !inStock || pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Please wait…' : 'Buy Now'}
        </button>
      </div>
    </div>
  )
}
