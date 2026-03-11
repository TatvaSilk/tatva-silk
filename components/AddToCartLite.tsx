// components/AddToCartLite.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddToCartLite({
  productId,
  qty = 1,
  label = 'Add to Cart',
}: {
  productId: string;
  qty?: number;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function add() {
    try {
      setBusy(true);
      const raw = localStorage.getItem('cart') || '[]';
      const cart: { productId: string; qty: number }[] = JSON.parse(raw);
      const idx = cart.findIndex((x) => x.productId === productId);
      if (idx >= 0) cart[idx].qty += qty;
      else cart.push({ productId, qty });
      localStorage.setItem('cart', JSON.stringify(cart));
      // Optionally notify your existing drawer
      window.dispatchEvent(new CustomEvent('cart:add', { detail: { productId, qty } }));
      router.push('/cart'); // go to cart page
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={add}
      disabled={busy}
      style={{
        background: '#111827',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
      }}
    >
      {busy ? 'Adding…' : label}
    </button>
  );
}
