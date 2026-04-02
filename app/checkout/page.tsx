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

  // ✅ auth
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // ✅ cart safety
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartReady, setCartReady] = useState(false)

  // ✅ products
  const [products, setProducts] = useState<Record<string, Product>>({})

  // ✅ form state
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' })
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
  const [error, setError] = useState<string | null>(null)

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/account'
        return
      }
      setUserId(data.user.id)
      setAuthChecked(true)
    }).catch((e) => {
      console.error('Auth error', e)
      setError('Authentication error')
    })
  }, [supabase])

  /* ---------------- LOAD CART (SAFE) ---------------- */
  useEffect(() => {
    try {
      const c = getCart()
      setCart(Array.isArray(c) ? c : [])
    } catch (e) {
      console.error('Cart error', e)
      setCart([])
      setError('Cart data corrupted. Please add products again.')
    } finally {
      setCartReady(true)
    }
  }, [])

  /* ---------------- LOAD PRODUCTS ---------------- */
  useEffect(() => {
    async function loadProducts() {
      if (!cart.length) return
      try {
        const ids = cart.map((l) => l.productId)
        const { data, error } = await supabase
          .from('products')
          .select('id,name,offer_price,original_price')
          .in('id', ids)

        if (error) throw error
        const map: Record<string, Product> = {}
        data?.forEach((p: any) => (map[p.id] = p))
        setProducts(map)
      } catch (e) {
        console.error('Product load error', e)
        setError('Failed to load products')
      }
    }
    loadProducts()
  }, [cart, supabase])

  /* ---------------- TOTAL (SAFE) ---------------- */
  const subtotal = useMemo(() => {
    if (!cart.length) return 0
    return cart.reduce((sum, l) => {
      const p = products[l.productId]
      if (!p) return sum
      const price =
        typeof p.offer_price === 'number'
          ? p.offer_price
          : p.original_price ?? 0
      return sum + price * l.qty
    }, 0)
  }, [cart, products])

  const total = subtotal + (payMethod === 'COD' ? COD_FEE : 0)

  /* ---------------- PLACE ORDER ---------------- */
  async function placeOrder() {
    setError(null)

    if (!userId) return setError('Please login again')
    if (!cart.length) return setError('Cart is empty')

    if (!customer.name || !customer.phone) {
      return setError('Enter name and phone')
    }

    if (!address.line1 || !address.city || !address.state || !address.pincode) {
      return setError('Complete delivery address')
    }

    if (payMethod === 'UPI' && !utr.trim()) {
      return setError('Enter UPI reference')
    }

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer_id: userId,
          items: cart,
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

      localStorage.setItem('cart', '[]')
      window.location.href = `/thank-you?order=${data.orderNo}`
    } catch (e) {
      console.error('Order crash', e)
      setError('Order failed. Please try again.')
    }
  }

  /* ---------------- LOADING GUARD ---------------- */
  if (!authChecked || !cartReady) {
    return <p style={{ padding: 40 }}>Loading checkout…</p>
  }

  /* ---------------- UI ---------------- */
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1>Checkout</h1>

      <h3>Customer Details</h3>
      <input value={customer.name} placeholder="Name"
        onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
      <input value={customer.phone} placeholder="Phone"
        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
      <input value={customer.email} placeholder="Email"
        onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />

      <h3>Delivery Address</h3>
      <input placeholder="Line 1" value={address.line1}
        onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
      <input placeholder="Line 2" value={address.line2}
        onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
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
      <br />
      <label>
        <input type="radio" checked={payMethod === 'UPI'}
          onChange={() => setPayMethod('UPI')} /> Pay by UPI
      </label>

      {payMethod === 'UPI' && (
        <input placeholder="UPI Ref" value={utr}
          onChange={(e) => setUtr(e.target.value)} />
      )}

      <h3>Total: {inr(total)}</h3>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <button onClick={placeOrder}
        style={{ padding: 12, background: '#f59e0b', borderRadius: 6 }}>
        Place Order
      </button>
    </main>
  )
}
