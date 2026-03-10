'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Cat = { id: string; label: string; slug: string; parent_id: string | null; children?: Cat[] };

type Props = {
  parentSlug?: string;
  limit?: number;
  showAllChildren?: boolean;
  linkClassName?: string;
  itemClassName?: string;
};

export default function PublicCategoriesNavSafe({
  parentSlug,
  limit,
  showAllChildren,
  linkClassName,
  itemClassName,
}: Props) {
  const [parents, setParents] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/store/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch categories');
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

  const children = useMemo(() => {
    if (!parents.length) return [];
    if (showAllChildren) return parents.flatMap(p => p.children ?? []);
    if (parentSlug) {
      const p = parents.find(x => (x.slug ?? '').toLowerCase() === parentSlug.toLowerCase());
      return p?.children ?? [];
    }
    return parents[0]?.children ?? [];
  }, [parents, parentSlug, showAllChildren]);

  const items = useMemo(() => {
    const sorted = children
      .filter(c => !!c?.slug)
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    return typeof limit === 'number' ? sorted.slice(0, Math.max(0, limit)) : sorted;
  }, [children, limit]);

  if (loading || !items.length) return null;

  return (
    <>
      {items.map(c => {
        const slug = (c.slug ?? '').toLowerCase();
        return (
          <li key={c.id} className={itemClassName}>
            <Link
              href={`/products?category=${encodeURIComponent(slug)}`}
              className={linkClassName}
            >
              {c.label}
            </Link>
          </li>
        );
      })}
    </>
  );
}
``
