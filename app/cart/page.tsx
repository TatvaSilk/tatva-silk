// app/cart/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type CartItem = { productId: string; qty: number };

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('cart') || '[]';
    setItems(JSON.parse(raw));
  }, []);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>
      <h1>Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty. <Link href="/products" style={{ color: '#2563eb' }}>Continue shopping →</Link></p>
      ) : (
        <>
          <p>{totalItems} item(s)</p>
          <ul style={{ paddingLeft: 16 }}>
            {items.map((it, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                Product #{it.productId} — qty {it.qty}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 16 }}>
            <Link
              href="/checkout"
              style={{ background: '#f59e0b', color: '#111827', padding: '8px 12px', borderRadius: 8, textDecoration: 'none' }}
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
