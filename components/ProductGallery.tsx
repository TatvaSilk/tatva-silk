'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

export type ProductImage = {
  url: string | null;
  alt: string | null;
  sort_order: number | null;
};

type Props = {
  images: ProductImage[];
  name?: string | null;
  /** Max height for the main image area (px). Default: 420 */
  mainHeight?: number;
  /** Thumbnail size (square, px). Default: 74 */
  thumbSize?: number;
  /** Show subtle zoom on hover for main image. Default: true */
  enableHoverZoom?: boolean;
  /** Rounded radius for all images (px). Default: 8 */
  radius?: number;
  /** Optional: render under the main image (e.g., caption, badges) */
  underMain?: React.ReactNode;
};

function isValidHttpUrl(u?: string | null) {
  return typeof u === 'string' && /^https?:\/\//i.test(u);
}

export default function ProductGallery({
  images,
  name,
  mainHeight = 420,
  thumbSize = 74,
  enableHoverZoom = true,
  radius = 8,
  underMain,
}: Props) {
  // Order: valid URLs first, then by sort_order
  const ordered = useMemo(
    () =>
      (images ?? [])
        .filter((img) => isValidHttpUrl(img.url))
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)),
    [images]
  );

  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const main = ordered[index] ?? null;

  // Keyboard support: ←/→ to switch images
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      // Only react if focus is inside the gallery container to avoid hijacking page keys
      const isInside = containerRef.current.contains(document.activeElement);
      if (!isInside) return;

      if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        setIndex((i) => Math.min(ordered.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ordered.length]);

  if (!ordered.length) {
    return (
      <div
        style={{
          width: '100%',
          height: mainHeight,
          borderRadius: radius,
          border: '1px dashed #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          background: '#f8fafc',
        }}
      >
        No images
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `${thumbSize + 6}px 1fr`,
        gap: 12,
        alignItems: 'start',
      }}
      tabIndex={0}
    >
      {/* Thumbnails (left column) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: mainHeight,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        {ordered.map((img, i) => {
          const active = i === index;
          return (
            <button
              key={`${img.url}-${i}`}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              style={{
                width: thumbSize,
                height: thumbSize,
                borderRadius: radius,
                overflow: 'hidden',
                border: active ? '2px solid #2563eb' : '1px solid #e5e7eb',
                background: '#fff',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url ?? ''}
                alt={img.alt ?? name ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {/* Main image (right column) */}
      <div>
        <div
          onMouseEnter={() => enableHoverZoom && setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          style={{
            position: 'relative',
            width: '100%',
            height: mainHeight,
            borderRadius: radius,
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
              style={{
                objectFit: 'cover',
                transform: hovering ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 140ms ease-in-out',
              }}
              priority
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
          )}
        </div>

        {/* Optional slot under main image */}
        {underMain ? <div style={{ marginTop: 8 }}>{underMain}</div> : null}
      </div>
    </div>
  );
}
