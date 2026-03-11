'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Cat = { id: string; label: string; slug: string; parent_id: string | null; children?: Cat[] };

export default function HomeFilterBar({
  parentSlug = 'sarees',
  max = 12,
  title = 'Shop by sub‑category',
}: {
  parentSlug?: string;
  max?: number;
  title?: string;
}) {
  const [parents, setParents] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data: Cat[] = await res.json();
        if (alive) setParents(data ?? []);
      } catch {
        if (alive) setParents([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const chips = useMemo(() => {
    const p = parents.find(x => (x.slug ?? '').toLowerCase() === parentSlug.toLowerCase());
    const kids = (p?.children ?? []).slice().sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return kids.slice(0, max);
  }, [parents, parentSlug, max]);

  if (loading || !chips.length) return null;

  return (
    <section className="container" style={{ marginTop: 10, marginBottom: 8 }}>
      <h3 className="section-title" style={{ marginBottom: 10 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {chips.map(c => (
          <Link
            key={c.id}
            href={`/products?category=${encodeURIComponent((c.slug ?? '').toLowerCase())}`}
            className="btn btn--primary"
            style={{ textTransform: 'capitalize' }}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
