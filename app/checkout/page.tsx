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
  // Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Auth state
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Cart & products
  const [cart, setCart] = useState<CartLine[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})

  // Customer details
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  })

  // Shipping address
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN',
  })

  // Payment
  const [payMethod, setPayMethod] = useState<'COD' | 'UPI'>('COD')
  const [utr, setUtr] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ✅ Step 1: Ensure user is logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        // Not logged in → redirect to account page
        window.location.href = '/account'
        return
      }
      setUserId(data.user.id)
      setAuthChecked(true)
    })
  }, [supabase])

  // Show loader until auth check completes
  if (!authChecked) {
    return <p style={{ padding: 40 }}>Checking login…</p>
  }

  // ✅ Step 2: Load cart
  useEffect(() => {
    setCart(getCart())
  }, [])

  // ✅ Step 3: Load product prices
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

  // ✅ Step 4: Calculate subtotal
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

  // ✅ Step 5: Place order
  async function placeOrder() {
    setError(null)

    if (!userId) {
      setError('Please login again')
      return
    }

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

    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    const items = cart.map((l) => ({
      productId: l.productId,
      qty: l.qty,
    }))

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer_id: userId,
        items,
        amount: total,
        payment_status: payMethod === 'COD' ? 'cod_pending' : 'paid',
        customer,
        address,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data?.error || 'Order failed')
      return
    }

    // Clear cart and redirect
    localStorage.setItem('cart', '[]')
    window.location.href = `/thank-you?order=${data.orderNo}`
  }

  // ✅ UI
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1>Checkout</h1>

      <h3>Customer Details</h3>
      <input
        placeholder="Full Name"
        value={customer.name}
        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
      />
      <input
        placeholder="Phone"
        value={customer.phone}
        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
      />
      <input
        placeholder="Email (optional)"
        value={customer.email}
        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
      />

      <h3>Delivery Address</h3>
      <input
        placeholder="Address line 1"
        value={address.line1}
        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
      />
      <input
        placeholder="Address line 2"
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

      <h3>Payment Method</h3>
      <label>
        <input
          type="radio"
          checked={payMethod === 'COD'}
          onChange={() => setPayMethod('COD')}
        />{' '}
        Cash on Delivery
      </label>
      <br />
      <label>
        <input
          type="radio"
          checked={payMethod === 'UPI'}
          onChange={() => setPayMethod('UPI')}
        />{' '}
        Pay by UPI
      </label>

      {payMethod === 'UPI' && (
        <input
          placeholder="UPI Reference (UTR)"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
        />
      )}

      <h3>Total: {inr(total)}</h3>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <button
        onClick={placeOrder}
        style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#f59e0b',
          border: 'none',
          borderRadius: 6,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Place Order
      </button>
    </main>
  )
}
