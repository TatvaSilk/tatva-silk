'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Cat = { id: string; label: string; slug: string; parent_id: string | null };

export default function PublicParentsNav({ limit = 8, linkClassName = '' }: { limit?: number; linkClassName?: string }) {
  const [rows, setRows] = useState<Cat[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json(); // this returns parents with children
        setRows(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, []);

  const parents = useMemo(() => {
    const list = rows
      .map((p: any) => ({ id: p.id, label: p.label, slug: p.slug, parent_id: null } as Cat))
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return list.slice(0, limit);
  }, [rows, limit]);

  if (!parents.length) return null;

  return (
    <>
      {parents.map(p => (
        <li key={p.id}>
          {/* Using parent slug; the products page will expand this to all of its children */}
          <Link href={`/products?category=${encodeURIComponent((p.slug ?? '').toLowerCase())}`} className={linkClassName}>
            {p.label}
          </Link>
        </li>
      ))}
    </>
  );
}
