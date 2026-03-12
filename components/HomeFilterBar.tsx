// components/HomeFilterBar.tsx
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // make sure your /api/store/categories route is dynamic/no-store
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (alive) setParents(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (alive) setParents([]);
        if (alive) setError(e?.message ?? 'Failed to load categories');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const chips = useMemo(() => {
    const p = (parents ?? []).find(
      x => (x.slug ?? '').toLowerCase() === (parentSlug ?? '').toLowerCase()
    );
    const kids = (p?.children ?? [])
      .slice()
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''))
      .slice(0, max);
    return kids;
  }, [parents, parentSlug, max]);

  // Slim, readable states
  if (loading) {
    return (
      <section className="container" style={{ marginTop: 10, marginBottom: 8 }}>
        <div style={{ height: 38, display: 'flex', alignItems: 'center', color: '#64748b' }}>
          Loading categories…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container" style={{ marginTop: 10, marginBottom: 8 }}>
        <div style={{ height: 38, display: 'flex', alignItems: 'center', color: '#ef4444' }}>
          {error}
        </div>
      </section>
    );
  }

  if (!chips.length) {
    return (
      <section className="container" style={{ marginTop: 10, marginBottom: 8 }}>
        <div style={{ height: 38, display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
          No sub‑categories found for “{parentSlug}”.
        </div>
      </section>
    );
  }

  return (
    <section className="container" style={{ marginTop: 10, marginBottom: 8 }}>
      <h3 className="section-title" style={{ margin: '0 0 10px', fontSize: 18 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {chips.map(c => {
          const cSlug = (c.slug ?? '').toLowerCase();
          return (
            <Link
              key={c.id}
              href={`/products?category=${encodeURIComponent(cSlug)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 34,
                padding: '0 12px',
                borderRadius: 999,
                background: '#0ea5e9',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
                textTransform: 'capitalize',
              }}
            >
              {c.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
