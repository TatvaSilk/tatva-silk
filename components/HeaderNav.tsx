// components/HeaderNav.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HeaderNav() {
  const [q, setQ] = useState('')
  const router = useRouter()

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    router.push(`/products?search=${encodeURIComponent(term)}`)
  }

  return (
    <header className="header">
      <div className="container header-row">
        {/* Logo + location */}
        <div className="logo">
          <span className="logo-badge">TS</span>
          <div>
            <div style={{ fontWeight: 800, lineHeight: 1 }}>Tatva Silk</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              Deliver to Billimora, Navsari 396321
            </div>
          </div>
        </div>

        {/* Address (hidden on md-) */}
        <div className="addr hide-md">
          Deliver to <strong>Billimora, Navsari</strong>
        </div>

        {/* Search */}
        <form className="search" onSubmit={onSearch}>
          <select defaultValue="all">
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
        <div className="account hide-md">
          <Link href="/admin">Account &amp; Lists</Link>
          <strong>Orders</strong>
        </div>

        {/* Cart */}
        <div className="cart">🛒 Cart</div>
      </div>
    </header>
  )
}
