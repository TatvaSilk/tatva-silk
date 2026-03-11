// components/OneRowCategoriesNav.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Cat = { id: string; label: string; slug: string; parent_id: string | null; children?: Cat[] };

export default function OneRowCategoriesNav({
  limitParents = 24,
  limitChildren = 24,
}: {
  limitParents?: number;
  limitChildren?: number;
}) {
  const [parents, setParents] = useState<Cat[]>([]);
  const [hoverSlug, setHoverSlug] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // IMPORTANT: avoid client cache
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (alive) setParents(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (alive) {
          setParents([]);
          setError(e?.message ?? 'Failed to load categories');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const parentItems = useMemo(() => {
    const list = (parents ?? []).slice().sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return list.slice(0, limitParents);
  }, [parents, limitParents]);

  if (loading) {
    return (
      <div style={{ height: 40, display: 'flex', alignItems: 'center', color: '#cbd5e1' }}>
        Loading categories…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: 40, display: 'flex', alignItems: 'center', color: '#fca5a5' }}>
        Categories failed: {error}
      </div>
    );
  }

  if (!parentItems.length) {
    return (
      <div style={{ height: 40, display: 'flex', alignItems: 'center', color: '#cbd5e1' }}>
        No categories found
      </div>
    );
  }

  return (
    <ul style={{ display: 'flex', gap: 18, listStyle: 'none', margin: 0, padding: '10px 0', position: 'relative' }}>
      {parentItems.map((p) => {
        const pSlug = (p.slug ?? '').toLowerCase();
        const children = (p.children ?? [])
          .slice()
          .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''))
          .slice(0, limitChildren);

        return (
          <li
            key={p.id}
            onMouseEnter={() => setHoverSlug(pSlug)}
            onMouseLeave={() => setHoverSlug('')}
            style={{ position: 'relative' }}
          >
            <Link href={`/products?category=${encodeURIComponent(pSlug)}`} style={{ color: '#fff' }}>
              {p.label}
            </Link>

            {!!children.length && hoverSlug === pSlug && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  background: '#1f2937',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  display: 'flex',
                  gap: 12,
                  zIndex: 40,
                  whiteSpace: 'nowrap',
                }}
              >
                {children.map((c) => {
                  const cSlug = (c.slug ?? '').toLowerCase();
                  return (
                    <Link
                      key={c.id}
                      href={`/products?category=${encodeURIComponent(cSlug)}`}
                      style={{ color: '#e5e7eb', fontWeight: 600, padding: '4px 6px', borderRadius: 6 }}
                    >
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
