'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

export type ProductImage = { url: string | null; alt: string | null; sort_order: number | null };

function isValidHttpUrl(u?: string | null) {
  return typeof u === 'string' && /^https?:\/\//i.test(u);
}

export default function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string | null | undefined;
}) {
  const ordered = useMemo(
    () =>
      (images ?? [])
        .filter((img) => isValidHttpUrl(img.url))
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)),
    [images]
  );
  const [index, setIndex] = useState(0);
  const main = ordered[index] ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
      {/* Thumbnails (left) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflow: 'auto' }}>
        {ordered.map((img, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            style={{
              width: 74,
              height: 74,
              borderRadius: 8,
              overflow: 'hidden',
              border: i === index ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: '#fff',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url ?? ''}
              alt={img.alt ?? name ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>

      {/* Main image (right) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 420,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          background: '#fff',
        }}
      >
        {main ? (
          <Image
            src={main.url!}
            alt={main.alt ?? name ?? 'Product image'}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
        )}
      </div>
    </div>
  );
}
