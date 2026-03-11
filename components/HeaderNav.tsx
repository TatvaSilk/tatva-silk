// components/HeaderNav.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useCartCount } from '@/hooks/useCartCount';
import CartDrawer from '@/components/CartDrawer';
import TwoLevelCategoriesNav from '@/components/TwoLevelCategoriesNav';

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
    return () => {
      mounted = false;
    };
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
      <header style={{ background: '#131921', color: '#fff' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 16px',
            whiteSpace: 'nowrap',
          }}
        >
          {/* LOGO → HOME */}
          <Link href="/" aria-label="Tatva Silk – Home" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#0f172a',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                color: '#fff',
              }}
            >
              TS
            </div>
            <strong>Tatva Silk</strong>
          </Link>

          {/* SEARCH */}
          <form onSubmit={onSearch} style={{ display: 'flex', flex: 1, maxWidth: 520 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Tatva Silk"
              aria-label="Search Tatva Silk"
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px 0 0 6px',
                border: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 16px',
                background: '#febd69',
                border: 'none',
                borderRadius: '0 6px 6px 0',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>

          {/* ACCOUNT */}
          <div
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Hello, {userEmail ? userEmail.split('@')[0] : 'sign in'}
            </div>
            <div style={{ fontWeight: 700 }}>Account &amp; Lists ▾</div>

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
                  boxShadow: '0 10px 30px rgba(0,0,0,.25)',
                }}
              >
                {userEmail ? (
                  <button
                    onClick={signOut}
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: '#fff',
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link href="/account">Sign in</Link>
                )}
              </div>
            )}
          </div>

          {/* ORDERS */}
          <Link href="/orders" style={{ fontWeight: 700 }}>
            Orders
          </Link>

          {/* CART */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('cart:open'))}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
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

        {/* ====== TWO‑LEVEL CATEGORY BAR (PARENTS + ACTIVE CHILDREN) ====== */}
        <nav style={{ background: '#232f3e' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'block', padding: '0 16px' }}>
            <Suspense
              fallback={
                <div style={{ height: 40, display: 'flex', alignItems: 'center', color: '#cbd5e1' }}>
                  Loading categories…
                </div>
              }
            >
              <TwoLevelCategoriesNav />
            </Suspense>
          </div>
        </nav>
      </header>

      {/* CART DRAWER PORTAL */}
      <CartDrawer />
    </>
  );
}
