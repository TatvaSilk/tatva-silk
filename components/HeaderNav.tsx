'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useCartCount } from '@/hooks/useCartCount';
import CartDrawer from '@/components/CartDrawer';
import PublicCategoriesNavSafe from '@/components/PublicCategoriesNavSafe';

export default function HeaderNav() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const liveCount = useCartCount();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserEmail(data.user?.email ?? null);
    });
    return () => { mounted = false; };
  }, [supabase]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/products?search=${encodeURIComponent(term)}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <>
      {/* ====== MAIN HEADER ====== */}
      <header className="header">
        <div className="container">
          <div className="header-row">
            {/* LOGO */}
            /
              <span className="logo-badge">TS</span>
              <span className="logo-text">Tatva Silk</span>
            </Link>

            {/* (OPTIONAL) Address / Language blocks */}
            <div className="addr hide-md">
              Deliver to
              <strong>Your location</strong>
            </div>

            {/* SEARCH */}
            <form className="search" onSubmit={onSearch}>
              {/* If you have a category select, place it here */}
              {/* <select><option>All</option></select> */}
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Tatva Silk"
                aria-label="Search products"
              />
              <button type="submit">Search</button>
            </form>

            {/* ACCOUNT DROPDOWN */}
            <div
              className="account"
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <div>Hello, {userEmail ? userEmail.split('@')[0] : 'sign in'}</div>
              <strong>Account &amp; Lists ▾</strong>

              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    background: '#fff',
                    color: '#111',
                    borderRadius: 8,
                    minWidth: 220,
                    padding: 12,
                    zIndex: 9999,
                    boxShadow: 'var(--shadow-3)',
                  }}
                >
                  {userEmail ? (
                    <button
                      onClick={signOut}
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: '#fff',
                      }}
                    >
                      Sign out
                    </button>
                  ) : (
                    /accountSign in</Link>
                  )}
                </div>
              )}
            </div>

            {/* ORDERS */}
            /ordersOrders</Link>

            {/* CART */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('cart:open'))}
              className="cart"
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 800,
              }}
              aria-label="Open cart"
            >
              🛒 Cart
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -10,
                  background: '#f08804',
                  color: '#111',
                  borderRadius: 999,
                  fontSize: 12,
                  padding: '0 6px',
                }}
              >
                {liveCount}
              </span>
            </button>
          </div>
        </div>

        {/* ====== CATEGORY STRIP (dynamic) ====== */}
        <div className="cat-strip">
          <div className="container">
            {/* We use <ul class="cat-list"> so your CSS applies: .cat-list and .cat-list a */}
            <ul className="cat-list">
              {/* Renders sub‑categories (children) of the chosen parent.
                 If your main parent is not "sarees", change parentSlug accordingly.
                 Remove parentSlug to show the first parent’s children from DB. */}
              <PublicCategoriesNavSafe parentSlug="sarees" limit={12} />
            </ul>
          </div>
        </div>
      </header>

      {/* CART DRAWER PORTAL */}
      <CartDrawer />
    </>
  );
}
