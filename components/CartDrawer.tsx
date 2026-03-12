// components/CartDrawer.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { CART_EVENT, CART_OPEN_EVENT, CartLine, getCart, remove, setQty, clear } from '@/lib/cart';

type Product = {
  id: string;
  name: string | null;
  offer_price: number | null;
  original_price: number | null;
  product_images: { url: string | null; alt: string | null; sort_order: number | null }[] | null;
  categories: { label: string | null; slug: string | null } | { label: string | null; slug: string | null }[] | null;
};

function inr(n: number | null | undefined) {
  if (typeof n !== 'number') return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
}

function pickImage(p?: Product | null) {
  const arr = (p?.product_images ?? []) as any[];
  const valid = arr
    .filter((x) => typeof x?.url === 'string' && /^https?:\/\//i.test(x.url))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  return valid[0]?.url ?? null;
}

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  function refreshLines() {
    const l = getCart();
    setLines(l);
  }

  async function loadProducts(ids: string[]) {
    if (!ids.length) {
      setProducts({});
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        original_price,
        offer_price,
        product_images ( url, alt, sort_order ),
        categories:category_id ( label, slug )
      `)
      .in('id', ids);

    if (!error && Array.isArray(data)) {
      const map: Record<string, Product> = {};
      for (const row of data as any[]) map[row.id] = row;
      setProducts(map);
    }
    setLoading(false);
  }

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const l of lines) {
      const p = products[l.productId];
      const price =
        typeof p?.offer_price === 'number' ? p.offer_price : (p?.original_price as number | null);
      if (typeof price === 'number') sum += price * l.qty;
    }
    return sum;
  }, [lines, products]);

  useEffect(() => {
    function onChanged() {
      refreshLines();
    }
    function onOpen() {
      setOpen(true);
      refreshLines();
    }
    window.addEventListener(CART_EVENT, onChanged);
    window.addEventListener(CART_OPEN_EVENT, onOpen);
    // initial
    refreshLines();
    return () => {
      window.removeEventListener(CART_EVENT, onChanged);
      window.removeEventListener(CART_OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    const ids = lines.map((l) => l.productId);
    loadProducts(ids);
  }, [lines]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.4)',
            zIndex: 9998,
          }}
        />
      )}

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Your Cart"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 420,
          height: '100%',
          background: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,.35)',
          zIndex: 9999,
          transform: open ? 'translateX(0)' : 'translateX(110%)',
          transition: 'transform .22s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <strong>Your Cart</strong>
          <button onClick={close} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ color: '#6b7280' }}>Loading…</div>
          ) : lines.length === 0 ? (
            <div style={{ color: '#6b7280' }}>Your cart is empty. Start shopping →</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {lines.map((l) => {
                const p = products[l.productId];
                const img = pickImage(p);
                const price =
                  typeof p?.offer_price === 'number' ? p.offer_price : (p?.original_price as number | null);
                const rel = Array.isArray(p?.categories) ? (p?.categories[0] ?? null) : (p?.categories ?? null);
                const childLabel = rel?.label ?? null;

                return (
                  <li key={l.productId} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 64, height: 64, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                      {img ? (
                        <Image src={img} alt={p?.name ?? 'Product image'} fill sizes="64px" style={{ objectFit: 'cover' }} />
                      ) : null}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, lineHeight: 1.3 }}>
                        <Link href={`/products/${l.productId}`}>{p?.name ?? `Product #${l.productId}`}</Link>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{childLabel ? childLabel.toLowerCase() : ''}</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                        <label style={{ fontSize: 12, color: '#6b7280' }}>Qty:</label>
                        <select
                          value={l.qty}
                          onChange={(e) => setQty(l.productId, Number(e.target.value))}
                          style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                        >
                          {Array.from({ length: 10 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => remove(l.productId)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{inr(price)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#6b7280' }}>Subtotal</span>
            <strong>{inr(subtotal)}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => (window.location.href = '/cart')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Continue shopping
            </button>
            <button
              onClick={() => (window.location.href = '/checkout')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#f59e0b',
                color: '#111827',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
