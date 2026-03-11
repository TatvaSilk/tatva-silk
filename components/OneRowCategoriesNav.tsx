'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Cat = { id: string; label: string; slug: string; parent_id: string | null };
type Parent = Cat & { children?: Cat[] };

export default function OneRowCategoriesNav({
  limitParents = 12,
  limitChildren = 24,
}: {
  limitParents?: number;
  limitChildren?: number;
}) {
  const searchParams = useSearchParams();
  const urlCat = (searchParams.get('category') ?? '').toLowerCase();

  const [parents, setParents] = useState<Parent[]>([]);
  const [hoverSlug, setHoverSlug] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed');
        const data: Parent[] = await res.json();
        if (alive) setParents(data ?? []);
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

  // which parent is currently active from URL? (if URL has a child, find its parent)
  const activeParentSlug = useMemo(() => {
    if (!urlCat) return '';
    const p = parents.find(x => (x.slug ?? '').toLowerCase() === urlCat);
    if (p) return (p.slug ?? '').toLowerCase();
    for (const p2 of parents) {
      const hit = (p2.children ?? []).find(c => (c.slug ?? '').toLowerCase() === urlCat);
      if (hit) return (p2.slug ?? '').toLowerCase();
    }
    return '';
  }, [urlCat, parents]);

  // styles
  const parentLinkStyle = (slug: string) =>
    ((slug ?? '').toLowerCase() === activeParentSlug)
      ? { fontWeight: 800, color: '#febd69' }
      : { color: '#fff' };

  if (!parents.length) return null;

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
            {/* parent link – clicking parent shows all its children on /products */}
            <Link
              href={`/products?category=${encodeURIComponent(pSlug)}`}
              style={parentLinkStyle(p.slug!)}
            >
              {p.label}
            </Link>

            {/* dropdown of children (one row) */}
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
                  const activeChild = cSlug === urlCat;
                  return (
                    <Link
                      key={c.id}
                      href={`/products?category=${encodeURIComponent(cSlug)}`}
                      style={{
                        color: activeChild ? '#febd69' : '#e5e7eb',
                        fontWeight: activeChild ? 800 : 600,
                        padding: '4px 6px',
                        borderRadius: 6,
                      }}
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
