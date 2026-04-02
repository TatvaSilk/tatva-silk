'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCart, CartLine } from '@/lib/cart'

type Product = {
  id: string
  name: string | null
  offer_price: number | null
  original_price: number | null
}

const COD_FEE = 0

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export default function CheckoutPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Cart
  const [cart, setCart] = useState<CartLine[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})

  // Customer
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  })

  // Address
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN',
  })

  // Payment
  const [payMethod, setPayMethod] = useState<'UPI' | 'COD'>('COD')
  const [utr, setUtr] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load cart from local storage
  useEffect(() => {
    setCart(getCart())
  }, [])

  // Load products for pricing
  useEffect(() => {
    async function loadProducts(ids: string[]) {
      if (!ids.length) return

      const { data } = await supabase
        .from('products')
        .select('id,name,offer_price,original_price')
        .in('id', ids)

      const map: Record<string, Product> = {}
      data?.forEach((p: any) => {
        map[p.id] = p
      })
      setProducts(map)
    }

    loadProducts(cart.map((l) => l.productId))
  }, [cart, supabase])

  // ✅ FIXED SUBTOTAL (NO l.price)
  const subtotal = useMemo(() => {
    return cart.reduce((sum, l) => {
      const p = products[l.productId]
      const price =
        typeof p?.offer_price === 'number'
          ? p.offer_price
          : p?.original_price ?? 0
      return sum + price * l.qty
    }, 0)
  }, [cart, products])

  const total = subtotal + (payMethod === 'COD' ? COD_FEE : 0)

  async function placeOrder() {
    setError(null)

    if (!customer.name || !customer.phone) {
      setError('Please enter name and phone number')
      return
    }

    if (!address.line1 || !address.city || !address.state || !address.pincode) {
      setError('Please complete delivery address')
      return
    }

    if (payMethod === 'UPI' && !utr.trim()) {
      setError('Please enter UPI reference (UTR)')
      return
    }

    const items = cart.map((l) => {
      const p = products[l.productId]
      const price =
        typeof p?.offer_price === 'number'
          ? p.offer_price
          : p?.original_price ?? 0
      return {
        productId: l.productId,
        name: p?.name,
        price,
        qty: l.qty,
      }
    })

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items,
        amount: total,
        payment_method: payMethod,
        payment_status: payMethod === 'COD' ? 'cod_pending' : 'paid',
        customer,
        address,
        upi: payMethod === 'UPI' ? { utr } : null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data?.error || 'Order failed')
      return
    }

    localStorage.setItem('cart', '[]')
    window.location.href = `/thank-you?order=${data.orderNo}`
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1>Checkout</h1>

      {/* CUSTOMER */}
      <h3>Customer Details</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <input
          placeholder="Full Name"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        />
        <input
          placeholder="Phone Number"
          value={customer.phone}
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
        />
        <input
          placeholder="Email (optional)"
          value={customer.email}
          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
        />
      </div>

      {/* ADDRESS */}
      <h3 style={{ marginTop: 20 }}>Delivery Address</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <input
          placeholder="Address Line 1"
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
        />
        <input
          placeholder="Address Line 2 (optional)"
          value={address.line2}
          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
        />
        <input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
        />
        <input
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
        />
        <input
          placeholder="Pincode"
          value={address.pincode}
          onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
        />
      </div>

      {/* PAYMENT */}
      <h3 style={{ marginTop: 20 }}>Payment Method</h3>

      <label>
        <input
          type="radio"
          checked={payMethod === 'UPI'}
          onChange={() => setPayMethod('UPI')}
        /> Pay by UPI
      </label>

      <br />

      <label>
        <input
          type="radio"
          checked={payMethod === 'COD'}
          onChange={() => setPayMethod('COD')}
        /> Cash on Delivery {COD_FEE > 0 ? `(₹${COD_FEE})` : ''}
      </label>

      {payMethod === 'UPI' && (
        <input
          placeholder="Enter UPI Reference (UTR)"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          style={{ marginTop: 10 }}
        />
      )}

      <h3 style={{ marginTop: 20 }}>
        Order Total: {inr(total)}
      </h3>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <button
        onClick={placeOrder}
        style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#f59e0b',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Place Order
      </button>
    </main>
  )
}
