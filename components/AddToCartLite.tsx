// components/AddToCartLite.tsx
'use client';

import { useState } from 'react';
import { add, openDrawer } from '@/lib/cart';

export default function AddToCartLite({
  productId,
  qty = 1,
  label = 'Add to Cart',
  open = 'drawer', // 'drawer' | 'cart' | 'stay'
}: {
  productId: string;
  qty?: number;
  label?: string;
  open?: 'drawer' | 'cart' | 'stay';
}) {
  const [busy, setBusy] = useState(false);

  function onAdd() {
    try {
      setBusy(true);
      add(productId, qty);
      if (open === 'drawer') openDrawer();
      else if (open === 'cart') window.location.href = '/cart';
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onAdd}
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
