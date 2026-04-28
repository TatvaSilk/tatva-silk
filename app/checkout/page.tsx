'use client'

import { useEffect, useMemo, useState } from { createClient } from '@supabase/supabase-js'import { useEffect, useMemo, useState } from 'react'
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
    village: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [shipping, setShipping] = useState<ShippingQuote | null>(null)

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
  }, [cart])

  /* ✅ Pincode lookup */
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
  }, [address.pincode])

  /* ✅ Subtotal */
  const subtotal = useMemo(() => {
    return cart.reduce((sum, l) => {
      const p = products[l.productId]
      const price = p?.offer_price ?? p?.original_price ?? 0
      return sum + price * l.qty
    }, 0)
  }, [cart, products])

  const total = subtotal + (shipping?.amount ?? 0)

  /* ✅ GET OR CREATE CUSTOMER PROFILE */
  async function getCustomerProfileId() {
    let { data } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('phone', customer.phone)
      .maybeSingle()

    if (data) return data.id

    const { data: created, error } = await supabase
      .from('customer_profiles')
      .insert({
        full_name: customer.name,
        phone: customer.phone,
        email: customer.email,
      })
      .select()
      .single()

    if (error) throw error
    return created.id
  }

  /* ✅ PLACE ORDER */
  async function placeOrder() {
    setError(null)

    if (!customer.name || !customer.phone)
      return setError('Enter customer name & phone')

    if (
      !address.line1 ||
      !address.village ||
      !address.city ||
      !address.state ||
      !address.pincode
    )
      return setError('Complete address')

    if (!shipping) return setError('Invalid pincode')

    try {
      const customerProfileId = await getCustomerProfileId()

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_id: customerProfileId,
          subtotal,
          delivery_fee: shipping.amount,
          grand_total: total,
          status: 'placed',
          payment_status: 'cod_pending',

          shipping_name: customer.name,
          shipping_phone: customer.phone,
          shipping_address_line1: address.line1,
          shipping_address_line2: address.village,
          shipping_city: address.city,
          shipping_state: address.state,
          shipping_pin: address.pincode,
        })
        .select()
        .single()

      if (error) throw error

      const items = cart.map(l => {
        const p = products[l.productId]
        const price = p?.offer_price ?? p?.original_price ?? 0
        return {
          order_id: order.id,
          product_id: l.productId,
          name: p?.name || 'Product',
          price,
          qty: l.qty,
        }
      })

      await supabase.from('order_items').insert(items)

      localStorage.setItem('cart', '[]')
      window.location.href = `/thank-you?order=${order.order_no}`
    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Order failed')
    }
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

      <button onClick={placeOrder} style={{ padding: 12, background: '#f59e0b' }}>
        Place Order
      </button>
    </main>
  )
}

