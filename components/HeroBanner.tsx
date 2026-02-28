// components/HeroBanner.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Slide = {
  id: string
  title: string
  text: string
  ctaLabel: string
  ctaHref: string
  img: string
}

const SLIDES: Slide[] = [
  {
    id: 'one',
    title: 'Fast shipping on beautiful silk sarees',
    text: 'Discover Tatva Silk collections curated from Billimora, Navsari.',
    ctaLabel: 'Shop Now',
    ctaHref: '/products',
    img: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'two',
    title: 'Save on festive collections',
    text: 'Limited‑time offers on Banarasi & Kanjivaram selections.',
    ctaLabel: 'View Offers',
    ctaHref: '/products?tag=deal',
    img: 'https://images.unsplash.com/photo-1604881982416-b8ac5a7f3f5b?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'three',
    title: 'Gifts under ₹2,000',
    text: 'Dupattas, stoles, and accessories crafted in silk.',
    ctaLabel: 'Browse Gifts',
    ctaHref: '/products?category=gifts',
    img: 'https://images.unsplash.com/photo-1622371235100-f7a2c2a19b36?q=80&w=1600&auto=format&fit=crop',
  },
]

export default function HeroBanner() {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const total = SLIDES.length

  function go(to: number) {
    setIdx(((to % total) + total) % total) // wrap safely
  }
  function next() {
    go(idx + 1)
  }
  function start() {
    stop()
    timerRef.current = setInterval(next, 4500)
  }
  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => {
    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]) // restart timer whenever user clicks a dot

  return (
    <div className="container" style={{ marginTop: 14, marginBottom: 16 }}>
      <div
        className="hero"
        onMouseEnter={stop}
        onMouseLeave={start}
        aria-label="Homepage promotions"
      >
        <div
          className="hero-inner"
          style={{
            position: 'relative',
            height: 320,
          }}
        >
          {/* Slides track */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: `${total * 100}%`,
                height: '100%',
                transform: `translateX(-${idx * (100 / total)}%)`,
                transition: 'transform .6s ease',
              }}
            >
              {SLIDES.map((s) => (
                <div
                  key={s.id}
                  style={{
                    minWidth: `${100 / total}%`,
                    position: 'relative',
                  }}
                >
                  {/* Background image */}
                  <Image
                    src={s.img}
                    alt={s.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    style={{ objectFit: 'cover' }}
                    priority={s.id === 'one'}
                  />

                  {/* Headline panel */}
                  <div
                    className="hero-content"
                    style={{
                      position: 'absolute',
                      left: 20,
                      top: 20,
                      maxWidth: 520,
                      background: 'rgba(255,255,255,.9)',
                      borderRadius: 8,
                      padding: 14,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <h2 style={{ margin: '0 0 6px' }}>{s.title}</h2>
                    <p style={{ margin: '0 0 10px', color: 'var(--muted)' }}>
                      {s.text}
                    </p>
                    <Link href={s.ctaHref} className="cta">
                      {s.ctaLabel}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 10,
              display: 'flex',
              gap: 6,
              justifyContent: 'center',
            }}
            aria-label="Slide indicators"
          >
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === idx ? '#334155' : '#cbd5e1',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
