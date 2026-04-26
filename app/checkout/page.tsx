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
    line1: '',     // Street / house
    village: '',   // ✅ NEW FIELD
    city: '',
    state: '',
    pincode: '',
  })

  const [shipping, setShipping] = useState<ShippingQuote | null>(null)

  /* ✅ User */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id)
        setCustomer(c => ({
          ...c,
          email: data.session.user.email || '',
        }))
      }
    })
  }, [supabase])

  /* ✅ Cart */
  useEffect(() => {
    const c = getCart()
    setCart(Array.isArray(c) ? c : [])
  }, [])

  /* ✅ Products */
  useEffect(() => {
    async function loadProducts() {
      if (!cart.length) return
      const ids = cart.map(l => l.productId)

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

    loadProducts()
  }, [cart, supabase])

  /* ✅ Pincode auto‑fill */
  useEffect(() => {
    async function lookupPincode() {
      if (address.pincode.length !== 6) return

      const { data } = await supabase
        .from('pincodes')
        .select('district,state')
        .eq('pin', address.pincode)
        .eq('active', true)
        .single()

      if (data) {
        setAddress(prev => ({
          ...prev,
          city: data.district,
          state: data.state,
        }))
        setShipping({ label: 'Standard (India)', amount: 99 })
      }
    }

    lookupPincode()
  }, [address.pincode, supabase])

  /* ✅ Subtotal */
  const subtotal = useMemo(() => {
    return cart.reduce((sum, l) => {
      const p = products[l.productId]
      const price = p?.offer_price ?? p?.original_price ?? 0
      return sum + price * l.qty
    }, 0)
  }, [cart, products])

  const total = subtotal + (shipping?.amount ?? 0)

  /* ✅ PLACE ORDER */
  async function placeOrder() {
    setError(null)

    if (!userId) return setError('Please login')
    if (!customer.name || !customer.phone) return setError('Enter name & phone')
    if (
      !address.line1 ||
      !address.village ||
      !address.city ||
      !address.state ||
      !address.pincode
    ) return setError('Complete address')
    if (!shipping) return setError('Invalid pincode')

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: userId,
        items: cart.map(l => {
          const p = products[l.productId]
          const price = p?.offer_price ?? p?.original_price ?? 0
          return {
            productId: l.productId,
            name: p?.name || 'Product',
            price,
            qty: l.qty,
          }
        }),
        amount: subtotal,
        delivery_fee: shipping.amount,
        payment_status: 'cod_pending',
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
        onChange={e => setCustomer({ ...customer, name: e.target.value })} />
      <input placeholder="Phone" value={customer.phone}
        onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
      <input placeholder="Email" value={customer.email}
        onChange={e => setCustomer({ ...customer, email: e.target.value })} />

      <h3>Delivery Address</h3>
      <input placeholder="Street / House"
        value={address.line1}
        onChange={e => setAddress({ ...address, line1: e.target.value })} />
      <input placeholder="Village / Town"
        value={address.village}
        onChange={e => setAddress({ ...address, village: e.target.value })} />
      <input placeholder="City" value={address.city} readOnly />
      <input placeholder="State" value={address.state} readOnly />
      <input placeholder="Pincode"
        value={address.pincode}
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
