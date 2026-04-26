'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCart, CartLine } from '@/lib/cart'

type Product = {
  id: string
  name: string | null
  price: number
}

type ShippingQuote = {
  label: string
  amount: number
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
  })

  const [shipping, setShipping] = useState<ShippingQuote | null>(null)

  /* ✅ Logged-in user */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id)
        setCustomer(c => ({ ...c, email: data.session?.user?.email || '' }))
      }
    })
  }, [supabase])

  /* ✅ Load cart */
  useEffect(() => {
    const c = getCart()
    setCart(Array.isArray(c) ? c : [])
  }, [])

  /* ✅ Load product prices (RUPEES) */
  useEffect(() => {
    async function loadProducts() {
      if (!cart.length) return

      const ids = cart.map(l => l.productId)

      const { data } = await supabase
        .from('products')
        .select('id,name,price')
        .in('id', ids)

      const map: Record<string, Product> = {}
      data?.forEach((p: any) => {
        map[p.id] = p
      })
      setProducts(map)
    }

    loadProducts()
  }, [cart, supabase])

  /* ✅ Subtotal (display only) */
  const subtotal = useMemo(() => {
    return cart.reduce((sum, l) => {
      const p = products[l.productId]
      return sum + (p?.price ?? 0) * l.qty
    }, 0)
  }, [cart, products])

  /* ✅ Fake shipping (₹99) */
  useEffect(() => {
    if (address.pincode.length === 6) {
      setShipping({ label: 'Standard (India)', amount: 99 })
    }
  }, [address.pincode])

  const total = subtotal + (shipping?.amount ?? 0)

  /* ✅ PLACE ORDER (OPTION A) */
  async function placeOrder() {
    setError(null)

    if (!userId) return setError('Please login')
    if (!customer.name || !customer.phone) return setError('Enter name & phone')
    if (!address.line1 || !address.city || !address.state || !address.pincode)
      return setError('Complete address')
    if (!shipping) return setError('Enter valid pincode')

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: userId,
        email: customer.email,

        cartItems: cart.map(l => ({
          id: l.productId,
          qty: l.qty,
        })),

        shipping: {
          name: customer.name,
          phone: customer.phone,
          address1: address.line1,
          address2: address.line2 || null,
          city: address.city,
          state: address.state,
          pin: address.pincode,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Order failed')
      return
    }

    localStorage.setItem('cart', '[]')
    window.location.href = `/thank-you?order=${data.order_no}`
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 40 }}>
      <h1>Checkout</h1>

      <h3>Customer Details</h3>
      <input placeholder="Name" value={customer.name}
        onChange={e => setCustomer({ ...customer, name: e.target.value })} />
      <input placeholder="Phone" value={customer.phone}
        onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
      <input placeholder="Email" value={customer.email}
        onChange={e => setCustomer({ ...customer, email: e.target.value })} />

      <h3>Delivery Address</h3>
      <input placeholder="Address" value={address.line1}
        onChange={e => setAddress({ ...address, line1: e.target.value })} />
      <input placeholder="City" value={address.city}
        onChange={e => setAddress({ ...address, city: e.target.value })} />
      <input placeholder="State" value={address.state}
        onChange={e => setAddress({ ...address, state: e.target.value })} />
      <input placeholder="Pincode" value={address.pincode}
        onChange={e => setAddress({ ...address, pincode: e.target.value })} />

      <h3>Summary</h3>
      <p>Subtotal: {inr(subtotal)}</p>
      <p>Shipping: {shipping ? inr(shipping.amount) : '—'}</p>
      <h3>Total: {inr(total)}</h3>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <button onClick={placeOrder}
        style={{ padding: 12, background: '#f59e0b' }}>
        Place Order
      </button>
    </main>
  )
}
