// app/cart/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { CartLine, getCart, setQty, remove, clear } from '@/lib/cart';

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

export default function CartPage() {
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
    setLines(getCart());
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

  useEffect(() => {
    refreshLines();
  }, []);
  useEffect(() => {
    loadProducts(lines.map((l) => l.productId));
  }, [lines]);

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

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ marginBottom: 8 }}>Cart</h1>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : lines.length === 0 ? (
        <p style={{ color: '#6b7280' }}>
          Your cart is empty. <Link href="/products">Continue shopping →</Link>
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Left: items */}
          <section>
            <div style={{ color: '#6b7280', marginBottom: 8 }}>
              {lines.reduce((s, l) => s + l.qty, 0)} item(s)
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
              {lines.map((l) => {
                const p = products[l.productId];
                const img = pickImage(p);
                const price =
                  typeof p?.offer_price === 'number' ? p.offer_price : (p?.original_price as number | null);
                const rel = Array.isArray(p?.categories) ? (p?.categories[0] ?? null) : (p?.categories ?? null);
                const childLabel = rel?.label ?? null;

                return (
                  <li key={l.productId} style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: 14, border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
                    <div style={{ width: 96, height: 96, position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#f3f4f6' }}>
                      {img ? (
                        <Image src={img} alt={p?.name ?? 'Product image'} fill sizes="96px" style={{ objectFit: 'cover' }} />
                      ) : null}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, lineHeight: 1.3 }}>
                        <Link href={`/products/${l.productId}`}>{p?.name ?? `Product #${l.productId}`}</Link>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{childLabel ? childLabel.toLowerCase() : ''}</div>

                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
                        <label style={{ fontSize: 12, color: '#6b7280' }}>Qty:</label>
                        <select
                          value={l.qty}
                          onChange={(e) => {
                            setQty(l.productId, Number(e.target.value));
                            refreshLines();
                          }}
                          style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                        >
                          {Array.from({ length: 10 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            remove(l.productId);
                            refreshLines();
                          }}
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
          </section>

          {/* Right: summary */}
          <aside style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>Subtotal</strong>
              <strong>{inr(subtotal)}</strong>
            </div>
            <button
              onClick={() => (window.location.href = '/checkout')}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#111827', fontWeight: 700, cursor: 'pointer' }}
            >
              Proceed to Checkout
            </button>
            <button
              onClick={() => {
                clear();
                refreshLines();
              }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', marginTop: 8 }}
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
