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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // IMPORTANT: no-store avoids client cache
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        if (alive) setParents(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setParents([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const parentItems = useMemo(() => {
    const list = (parents ?? []).slice().sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return list.slice(0, limitParents);
  }, [parents, limitParents]);

  if (!parentItems.length) return null;

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
