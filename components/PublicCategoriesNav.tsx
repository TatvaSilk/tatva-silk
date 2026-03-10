'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Cat = { id: string; label: string; slug: string; parent_id: string | null; children?: Cat[] };

type Props = {
  /** Optional: if you only want children of a specific parent (e.g., “Sarees”) provide its slug */
  parentSlug?: string;
  /** Optional: max number of child links to show in the bar */
  limit?: number;
  /** Optional: show ALL children from ALL parents when true */
  showAllChildren?: boolean;
};

export default function PublicCategoriesNav({ parentSlug, limit, showAllChildren }: Props) {
  const [parents, setParents] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed to fetch categories');
        const data: Cat[] = await res.json();
        if (alive) setParents(data);
      } catch {
        if (alive) setParents([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Decide which children to render in the top bar
  const children: Cat[] = useMemo(() => {
    if (showAllChildren) {
      return parents.flatMap(p => p.children ?? []);
    }
    if (parentSlug) {
      const p = parents.find(x => (x.slug ?? '').toLowerCase() === parentSlug.toLowerCase());
      return p?.children ?? [];
    }
    // default: take the first parent (common pattern: “Sarees”)
    return parents[0]?.children ?? [];
  }, [parents, parentSlug, showAllChildren]);

  const items = useMemo(() => {
    const list = children
      .filter(c => !!c.slug)
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return typeof limit === 'number' ? list.slice(0, Math.max(limit, 0)) : list;
  }, [children, limit]);

  if (loading) {
    // very light skeleton; you can replace by your shimmer UI
    return (
      <div style={{ display:'flex', gap:18 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ width:80, height:14, background:'#334155', borderRadius:4, opacity:0.5 }} />
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <nav style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
      {items.map(c => {
        const slug = (c.slug ?? '').toLowerCase();
        return (
          <Link
            key={c.id}
            href={`/products?category=${encodeURIComponent(slug)}`}
            style={{ color:'#e5e7eb', textDecoration:'none' }}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}
