'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Line = {
  id: number
  quantity: number
  price_cents: number
  product?: {
    id: string
    slug?: string | null
    name: string | null
    product_images?: { url: string | null; alt?: string | null; sort_order?: number | null }[]
  } | null
}

export default function CartDrawer() {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [cartId, setCartId] = useState<string | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [subscribing, setSubscribing] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Listen for global "cart:open" events from the header button
  useEffect(() => {
    function handleOpen() { setOpen(true) }
    window.addEventListener('cart:open' as any, handleOpen)
    return () => window.removeEventListener('cart:open' as any, handleOpen)
  }, [])

  // Initial bootstrap: session -> active cart -> load lines -> subscribe
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        setUserId(null)
        setCartId(null)
        setLines([])
        setLoading(false)
        return
      }
      setUserId(user.id)

      // Get or create active cart (works whether you use status='active' or a single-row-per-user)
      let cart: string | null = null

      // Try the RPC first (if you added it). If it fails, fall back to manual select/insert.
      const { data: rpcId, error: rpcErr } = await supabase.rpc('ensure_active_cart')
      if (!rpcErr && rpcId) {
        cart = rpcId as string
      } else {
        // fallback: find any cart row for the user
        const { data: c1 } = await supabase
          .from('carts')
          .select('id, status')
          .eq('customer_id', user.id)       // 👈 we use customer_id (not user_id)
          .limit(1)
          .maybeSingle()
        if (c1?.id) {
          cart = c1.id
        } else {
          const { data: c2, error: cErr } = await supabase
            .from('carts')
            .insert({ customer_id: user.id })
            .select('id')
            .single()
          if (!cErr && c2?.id) cart = c2.id
        }
      }

      setCartId(cart)
      await loadLines(cart)
      await ensureSubscribed(cart)

      setLoading(false)
    })()

    return () => {
      mounted = false
      // cleanup subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  async function loadLines(cart: string | null) {
    if (!cart) { setLines([]); return }
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        price_cents,
        product:products (
          id, slug, name,
          product_images (url, alt, sort_order)
        )
      `)
      .eq('cart_id', cart)
      .order('id', { ascending: true })

    if (error) return
    setLines((data ?? []) as any)
  }

  async function ensureSubscribed(cart: string | null) {
    if (!cart || subscribing) return
    setSubscribing(true)
    const ch = supabase
      .channel('cart_items_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cart}` },
        () => loadLines(cart)
      )
      .subscribe()
    channelRef.current = ch
  }

  function formatINR(n?: number | null) {
    const v = typeof n === 'number' ? n : 0
    // amounts are assumed in paise; divide by 100
    return `₹${(v / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price_cents * l.quantity, 0),
    [lines]
  )

  function coverUrl(l: Line) {
    const imgs = (l.product?.product_images ?? []).sort(
      (a, b) => (a?.sort_order ?? 9999) - (b?.sort_order ?? 9999)
    )
    return imgs[0]?.url ?? null
  }

  async function setQty(lineId: number, nextQty: number) {
    if (!cartId) return
    if (nextQty <= 0) {
      await removeLine(lineId)
      return
    }
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: nextQty })
      .eq('id', lineId)
    if (!error) {
      // optimistic UI
      setLines(prev => prev.map(l => l.id === lineId ? { ...l, quantity: nextQty } : l))
    }
  }

  async function removeLine(lineId: number) {
    if (!cartId) return
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', lineId)
    if (!error) setLines(prev => prev.filter(l => l.id !== lineId))
  }

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: open ? 'rgba(0,0,0,.4)' : 'transparent',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'background .2s ease',
          zIndex: 5000
        }}
      />

      {/* Drawer */}
      <aside
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          maxWidth: '92vw',
          height: '100dvh',
          background: '#fff',
          borderLeft: '1px solid #e5e7eb',
          boxShadow: '0 10px 30px rgba(0,0,0,.25)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .25s ease',
          zIndex: 6000,
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto'
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>Your Cart</div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            style={{ all: 'unset', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflow: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ padding: 16 }}>Loading cart…</div>
          ) : !userId ? (
            <div style={{ padding: 16 }}>
              Please /accountsign in</Link> to view your cart.
            </div>
          ) : lines.length === 0 ? (
            <div style={{ padding: 16 }}>
              Your cart is empty. /productsStart shopping →</Link>
            </div>
          ) : (
            <ul style={{ display: 'grid', gap: 10 }}>
              {lines.map((l) => {
                const img = coverUrl(l)
                const name = l.product?.name ?? 'Untitled'
                const lineTotal = l.price_cents * l.quantity
                const slug = l.product?.slug ?? l.product?.id
                return (
                  <li key={l.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 6, overflow: 'hidden', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                      {img ? (
                        <Image src={img} alt={name} fill sizes="64px" style={{ objectFit: 'cover' }} />
                      ) : null}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {slug ? (
                          /products/{slug}{name}</Link>
                        ) : name}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => setQty(l.id, l.quantity - 1)}
                          aria-label="Decrease"
                          style={btnQty}
                        >−</button>
                        <input
                          value={l.quantity}
                          onChange={(e) => {
                            const v = Math.max(0, parseInt(e.target.value || '0', 10) || 0)
                            setQty(l.id, v)
                          }}
                          inputMode="numeric"
                          style={{
                            width: 46,
                            textAlign: 'center',
                            border: '1px solid #e5e7eb',
                            borderRadius: 6,
                            padding: '6px 8px'
                          }}
                        />
                        <button
                          onClick={() => setQty(l.id, l.quantity + 1)}
                          aria-label="Increase"
                          style={btnQty}
                        >+</button>

                        <button
                          onClick={() => removeLine(l.id)}
                          aria-label="Remove"
                          style={{
                            all: 'unset',
                            color: '#ef4444',
                            cursor: 'pointer',
                            marginLeft: 8,
                            fontSize: 13
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatINR(lineTotal)}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #eee', padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ color: '#666' }}>Subtotal</div>
            <div style={{ fontWeight: 700 }}>{formatINR(subtotal)}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '10px 12px'
              }}
            >
              Continue shopping
            </button>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                display: 'inline-block',
                textAlign: 'center',
                background: '#111',
                color: '#fff',
                border: '1px solid #111',
                borderRadius: 8,
                padding: '10px 12px'
              }}
            >
              Checkout
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}

const btnQty: React.CSSProperties = {
  all: 'unset',
  width: 28,
  height: 28,
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  cursor: 'pointer',
  userSelect: 'none'
}
