'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type DeliveryPref = { pin: string; label: string }

export default function HeaderNav() {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Search
  const [q, setQ] = useState('')

  // Deliver-to state
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [delivery, setDelivery] = useState<DeliveryPref | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Auth + UI
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  // Load saved preference + auth + cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ts.delivery')
      if (raw) {
        const parsed = JSON.parse(raw) as DeliveryPref
        setDelivery(parsed)
      } else {
        // Default for first-time visitors (your earlier behavior)
        setDelivery({ pin: '396321', label: 'Billimora, Navsari, Gujarat' })
      }
    } catch { /* ignore */ }

    // Load cart count (placeholder). Replace with real cart later.
    try {
      const c = localStorage.getItem('cart_count')
      setCartCount(c ? parseInt(c, 10) : 0)
    } catch { /* ignore */ }

    // Load current user
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) return
      setUserEmail(u.email ?? null)
      // try to use metadata.name if you captured it at signup
      const name =
        (u.user_metadata?.name as string | undefined) ||
        (u.user_metadata?.full_name as string | undefined) ||
        null
      setUserName(name)
    })
  }, [])

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    router.push(`/products?search=${encodeURIComponent(term)}`)
  }

  function openZipDialog() {
    setPin(delivery?.pin ?? '')
    setErr(null)
    setOpen(true)
  }

  async function saveZip(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    const normalized = pin.trim()
    if (!/^\d{6}$/.test(normalized)) {
      setErr('Please enter a valid 6-digit PIN.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/pincode?pin=${normalized}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Lookup failed (${res.status})`)
      const json = (await res.json()) as { ok: boolean; pin: string; label: string }
      const label = json?.label || `PIN ${normalized}`
      const pref = { pin: normalized, label }
      setDelivery(pref)
      try { localStorage.setItem('ts.delivery', JSON.stringify(pref)) } catch {}
      setOpen(false)
    } catch (e: any) {
      setErr(e?.message ?? 'Could not resolve PIN. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const greeting = userName
    ? `Hello, ${userName.split(' ')[0]}`
    : userEmail
    ? `Hello, ${userEmail.split('@')[0]}`
    : 'Hello, sign in'

  return (
    <>
      {/* ====== Header Bar ====== */}
      <header className="header" style={{ background: '#1f2937', color: '#fff' }}>
        <div className="container header-row" style={{
          maxWidth: 1280, margin: '0 auto', padding: '10px 16px',
          display: 'grid', gridTemplateColumns: '220px 1fr auto auto auto', gap: 16, alignItems: 'center'
        }}>
          {/* Logo + Deliver to (clickable) */}
          <div className="logo" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
              <span className="logo-badge" style={{
                display: 'inline-grid', placeItems: 'center', width: 34, height: 34,
                borderRadius: 8, background: '#111827', border: '1px solid #334155', fontWeight: 800
              }}>TS</span>
              <div>
                <div style={{ fontWeight: 800, lineHeight: 1 }}>Tatva Silk</div>
                <button
                  onClick={openZipDialog}
                  style={{ all: 'unset', display: 'inline-block', fontSize: 11, opacity: 0.9, cursor: 'pointer' }}
                  aria-label="Change delivery location"
                >
                  Deliver to <strong>{delivery?.label ?? 'Choose location'}</strong>
                </button>
              </div>
            </Link>
          </div>

          {/* Secondary Deliver-to (hidden on md-) */}
          <div className="addr hide-md" style={{ fontSize: 12 }}>
            Deliver to <strong>{delivery?.label ?? 'Choose location'}</strong>
          </div>

          {/* Search */}
          <form className="search" onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
            <select defaultValue="all" aria-label="Search category" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #334155', background: '#111827', color: '#e5e7eb' }}>
              <option value="all">All</option>
              <option value="saree">Saree</option>
              <option value="banarasi">Banarasi</option>
            </select>
            <input
              placeholder="Search Tatva Silk"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #334155', background: '#111827', color: '#e5e7eb' }}
            />
            <button type="submit" style={{ padding: '10px 14px', borderRadius: 6, background: '#f59e0b', border: '1px solid #f59e0b', color: '#111' }}>
              Search
            </button>
          </form>

          {/* Language */}
          <div className="lang hide-md" style={{ fontSize: 12, textAlign: 'right' }}>
            Language <strong>EN</strong>
          </div>

          {/* Account & Lists (Amazon-style) */}
          <div
            className="account hide-md"
            style={{ position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div style={{ fontSize: 12, color: '#a1a1aa' }}>{greeting}</div>
            <div style={{ fontWeight: 700 }}>Account &amp; Lists ▾</div>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  background: '#fff',
                  color: '#111',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  minWidth: 340,
                  zIndex: 40,
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  padding: 16,
                }}
              >
                {!userEmail && (
                  <div style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Link href="/account" style={{ background: '#111', color: '#fff', padding: '8px 12px', borderRadius: 6 }}>
                      Sign in
                    </Link>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Account</div>
                    <ul style={{ lineHeight: 1.8 }}>
                      <li><Link href="/orders">Your Orders</Link></li>
                      <li><Link href="/account">Profile</Link></li>
                      <li><Link href="/account/addresses">Manage Addresses</Link></li>
                      <li><Link href="/account/payments">Payment Methods</Link></li>
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick Actions</div>
                    <ul style={{ lineHeight: 1.8 }}>
                      <li><Link href="/products?category=banarasi">Banarasi</Link></li>
                      <li><Link href="/products?category=patola">Patola</Link></li>
                      <li><Link href="/products?category=soft-silk">Soft Silk</Link></li>
                      <li><Link href="/today-deals">Today’s deals</Link></li>
                    </ul>
                  </div>
                </div>

                {userEmail && (
                  <div style={{ textAlign: 'right', marginTop: 12 }}>
                    <button
                      onClick={signOut}
                      style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 6 }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Returns & Orders */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#a1a1aa' }}>Returns</div>
            <div style={{ fontWeight: 700 }}>
              <Link href="/orders" style={{ color: '#fff' }}>&amp; Orders</Link>
            </div>
          </div>

          {/* Cart */}
          <div style={{ textAlign: 'right', position: 'relative' }}>
            <Link href="/cart" style={{ color: '#fff', textDecoration: 'none' }}>
              🛒 Cart
              <span
                style={{
                  position: 'absolute',
                  right: -10,
                  top: -10,
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: 999,
                  fontSize: 12,
                  lineHeight: '18px',
                  minWidth: 18,
                  textAlign: 'center',
                  padding: '0 4px'
                }}
              >
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ====== ZIP Modal ====== */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.35)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 60,
          }}
          onClick={() => !saving && setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveZip}
            style={{
              width: 'min(92vw, 420px)',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid var(--border)',
              boxShadow: '0 10px 30px rgba(0,0,0,.15)',
              padding: 16,
            }}
          >
            <h3 style={{ margin: '2px 0 10px' }}>Deliver to</h3>
            <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14 }}>
              Enter your 6‑digit PIN/ZIP to see delivery location.
            </p>

            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="e.g., 396321"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))
              }
              autoFocus
              disabled={saving}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
              }}
            />

            {err ? (
              <div style={{ color: 'crimson', marginTop: 8, fontSize: 13 }}>
                {err}
              </div>
            ) : null}

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 12,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '8px 12px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
