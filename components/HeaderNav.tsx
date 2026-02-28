// components/HeaderNav.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const PIN_MAP: Record<string, string> = {
  // Add more as needed
  '396321': 'Billimora, Navsari',
  '396445': 'Navsari',
  '395003': 'Surat',
}

type DeliveryPref = { pin: string; label: string }

export default function HeaderNav() {
  const [q, setQ] = useState('')
  const router = useRouter()

  // Delivery UI state
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [delivery, setDelivery] = useState<DeliveryPref | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Load saved delivery preference
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ts.delivery')
      if (raw) {
        const parsed = JSON.parse(raw) as DeliveryPref
        setDelivery(parsed)
      } else {
        // default (your current header message)
        setDelivery({ pin: '396321', label: 'Billimora, Navsari' })
      }
    } catch {
      // ignore
    }
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

  function saveZip(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    const normalized = pin.trim()
    if (!/^\d{6}$/.test(normalized)) {
      setErr('Please enter a valid 6-digit PIN.')
      return
    }
    const label = PIN_MAP[normalized] ?? `PIN ${normalized}`
    const pref: DeliveryPref = { pin: normalized, label }
    setDelivery(pref)
    try {
      localStorage.setItem('ts.delivery', JSON.stringify(pref))
    } catch {/* ignore */}
    setOpen(false)
  }

  return (
    <>
      {/* ====== Header Bar ====== */}
      <header className="header">
        <div className="container header-row">
          {/* Logo + location */}
          <div className="logo">
            <span className="logo-badge">TS</span>
            <div>
              <div style={{ fontWeight: 800, lineHeight: 1 }}>Tatva Silk</div>

              {/* 🔘 Clickable "Deliver to" that opens ZIP dialog */}
              <button
                onClick={openZipDialog}
                style={{
                  all: 'unset',
                  display: 'inline-block',
                  fontSize: 11,
                  opacity: 0.9,
                  cursor: 'pointer',
                }}
                aria-label="Change delivery location"
              >
                Deliver to <strong>{delivery?.label ?? 'Choose location'}</strong>
              </button>
            </div>
          </div>

          {/* Address (secondary spot, hidden on md-) */}
          <div className="addr hide-md">
            Deliver to <strong>{delivery?.label ?? 'Choose location'}</strong>
          </div>

          {/* Search */}
          <form className="search" onSubmit={onSearch}>
            <select defaultValue="all" aria-label="Search category">
              <option value="all">All</option>
              <option value="saree">Saree</option>
              <option value="banarasi">Banarasi</option>
            </select>
            <input
              placeholder="Search Tatva Silk"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          {/* Language */}
          <div className="lang hide-md">
            Language <strong>EN</strong>
          </div>

          {/* Account + Orders */}
          <div className="account hide-md" style={{ display: 'flex', gap: 10 }}>
            /admin
              Account &amp; Lists
            </Link>
            /orders
              <strong>Orders</strong>
            </Link>
          </div>

          {/* Cart */}
          <div className="cart">🛒 Cart</div>
        </div>
      </header>

      {/* ====== ZIP Dialog ====== */}
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
          onClick={() => setOpen(false)}
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
              onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              autoFocus
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
              }}
            />

            {err ? (
              <div style={{ color: 'crimson', marginTop: 8, fontSize: 13 }}>{err}</div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                style={{
                  padding: '8px 12px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>

            {/* Preview of what will show */}
            {pin.length === 6 ? (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                Will display as:{' '}
                <strong>{PIN_MAP[pin] ?? `PIN ${pin}`}</strong>
              </div>
            ) : null}
          </form>
        </div>
      ) : null}
    </>
  )
}
