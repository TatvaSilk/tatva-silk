// hooks/useCartCount.ts
'use client';

import { useEffect, useState } from 'react';
import { CART_EVENT, getCount } from '@/lib/cart';

export function useCartCount() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // initial
    setCount(getCount());

    function onChange() {
      setCount(getCount());
    }
    window.addEventListener(CART_EVENT, onChange);
    window.addEventListener('storage', onChange); // cross-tab

    return () => {
      window.removeEventListener(CART_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return count;
}
