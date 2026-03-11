'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Cat = { id: string; label: string; slug: string; parent_id: string | null };
type Parent = Cat & { children?: Cat[] };

export default function TwoLevelCategoriesNav({
  limitParents = 12,
  limitChildren = 16,
  linkClassName = '',
}: {
  limitParents?: number;
  limitChildren?: number;
  linkClassName?: string;
}) {
  const searchParams = useSearchParams();
  const urlCat = (searchParams.get('category') ?? '').toLowerCase();

  const [parents, setParents] = useState<Parent[]>([]);
  const [activeParentSlug, setActiveParentSlug] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed to fetch categories');
        const data: Parent[] = await res.json();
        if (!alive) return;

        setParents(data ?? []);

        // Decide which parent is active based on URL ?category=
        const byParent = (data ?? []).find(p => (p.slug ?? '').toLowerCase() === urlCat);
        if (byParent) {
          setActiveParentSlug((byParent.slug ?? '').toLowerCase());
          return;
        }
        for (const p of data ?? []) {
          const childHit = (p.children ?? []).find(c => (c.slug ?? '').toLowerCase() === urlCat);
          if (childHit) {
            setActiveParentSlug((p.slug ?? '').toLowerCase());
            return;
          }
        }
        if (data?.length) setActiveParentSlug((data[0].slug ?? '').toLowerCase());
      } catch {
        setParents([]);
      }
    })();
    return () => { alive = false; };
  }, [urlCat]);

  const parentItems = useMemo(() => {
    const list = (parents ?? []).slice().sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return list.slice(0, limitParents);
  }, [parents, limitParents]);

  const activeChildren = useMemo(() => {
    const p = (parents ?? []).find(x => (x.slug ?? '').toLowerCase() === activeParentSlug);
    const kids = (p?.children ?? []).slice().sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return kids.slice(0, limitChildren);
  }, [parents, activeParentSlug, limitChildren]);

  const isActiveParent = (slug?: string | null) => (slug ?? '').toLowerCase() === activeParentSlug;
  const isActiveChild = (slug?: string | null) => (slug ?? '').toLowerCase() === urlCat;

  if (!parents.length) return null;

  return (
    <>
      {/* Row 1: Main categories (parents) */}
      <ul style={{ display: 'flex', gap: 18, listStyle: 'none', margin: 0, padding: '10px 0' }}>
        {parentItems.map((p) => {
          const pSlug = (p.slug ?? '').toLowerCase();
          return (
            <li key={p.id}>
              <Link
                href={`/products?category=${encodeURIComponent(pSlug)}`}
                className={linkClassName}
                style={isActiveParent(p.slug) ? { fontWeight: 800, color: '#febd69' } : { color: '#fff' }}
                onMouseEnter={() => setActiveParentSlug(pSlug)}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Row 2: Sub‑categories (children of active parent) */}
      <ul style={{ display: 'flex', gap: 18, listStyle: 'none', margin: 0, padding: '6px 0 10px' }}>
        {activeChildren.map((c) => {
          const cSlug = (c.slug ?? '').toLowerCase();
          const active = isActiveChild(c.slug);
          return (
            <li key={c.id}>
              <Link
                href={`/products?category=${encodeURIComponent(cSlug)}`}
                className={linkClassName}
                style={active ? { fontWeight: 800, color: '#febd69' } : { color: '#fff' }}
              >
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
