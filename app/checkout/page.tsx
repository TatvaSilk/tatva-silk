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

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export default function CheckoutPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [userId, setUserId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [error, setError] = useState<string | null>(null)

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  })

  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN',
  })

  const [payMethod, setPayMethod] = useState<'COD' | 'UPI'>('COD')
  const [utr, setUtr] = useState('')

  /* ✅ Read user from existing session (no crash) */
  useEffect(() => {
    const session = supabase.auth.session?.()
    if (session?.user) {
      setUserId(session.user.id)
    }
  }, [])

  /* ✅ Load cart safely */
  useEffect(() => {
    try {
      const c = getCart()
      setCart(Array.isArray(c) ? c : [])
    } catch {
      setCart([])
    }
  }, [])

  /* ✅ Load product prices */
  useEffect(() => {
    async function loadProducts() {
      if (!cart.length) return
      const ids = cart.map((l) => l.productId)
      const { data } = await supabase
        .from('products')
        .select('id,name,offer_price,original_price')
        .in('id', ids)
      const map: Record<string, Product> = {}
      data?.forEach((p: any) => (map[p.id] = p))
      setProducts(map)
    }
    loadProducts()
  }, [cart, supabase])

  const subtotal = useMemo(() => {
    return cart.reduce((sum, l) => {
      const p = products[l.productId]
      const price = p?.offer_price ?? p?.original_price ?? 0
      return sum + price * l.qty
    }, 0)
  }, [cart, products])

  async function placeOrder() {
    setError(null)

    if (!userId) {
      setError('Please login to place order')
      return
    }

    if (!customer.name || !customer.phone) {
      setError('Enter name and phone')
      return
    }

    if (!address.line1 || !address.city || !address.state || !address.pincode) {
      setError('Complete delivery address')
      return
    }

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer_id: userId,
        items: cart,
        amount: subtotal,
        payment_status: payMethod === 'COD' ? 'cod_pending' : 'paid',
        customer,
        address,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Order failed')
      return
    }

    localStorage.setItem('cart', '[]')
    window.location.href = `/thank-you?order=${data.orderNo}`
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 40 }}>
      <h1>Checkout</h1>

      <h3>Customer Details</h3>
      <input placeholder="Name" value={customer.name}
        onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
      <input placeholder="Phone" value={customer.phone}
        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
      <input placeholder="Email" value={customer.email}
        onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />

      <h3>Delivery Address</h3>
      <input placeholder="Address" value={address.line1}
        onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
      <input placeholder="City" value={address.city}
        onChange={(e) => setAddress({ ...address, city: e.target.value })} />
      <input placeholder="State" value={address.state}
        onChange={(e) => setAddress({ ...address, state: e.target.value })} />
      <input placeholder="Pincode" value={address.pincode}
        onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />

      <h3>Payment</h3>
      <label>
        <input type="radio" checked={payMethod === 'COD'}
          onChange={() => setPayMethod('COD')} /> Cash on Delivery
      </label>

      <h3>Total: {inr(subtotal)}</h3>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <button onClick={placeOrder}
        style={{ padding: 12, background: '#f59e0b' }}>
        Place Order
      </button>
    </main>
  )
}
