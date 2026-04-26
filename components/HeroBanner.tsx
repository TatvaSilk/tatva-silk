'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Slide = {
  id: string
  title: string
  text: string
  cta_label: string
  cta_href: string
  img: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HeroBanner() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const total = slides.length

  function go(to: number) {
    if (!total) return
    setIdx(((to % total) + total) % total)
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

  // ✅ Fetch banners from Supabase
  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) {
          console.error('Banner fetch failed', error)
        } else if (data) {
          setSlides(data)
        }
      })
  }, [])

  useEffect(() => {
    if (slides.length) start()
    return stop
  }, [idx, slides.length])

  if (!slides.length) return null

  return (
    <div className="container" style={{ marginTop: 14, marginBottom: 16 }}>
      <div onMouseEnter={stop} onMouseLeave={start}>
        <div
          style={{
            position: 'relative',
            height: 320,
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
            {slides.map((s, i) => (
              <div
                key={s.id}
                style={{
                  minWidth: `${100 / total}%`,
                  position: 'relative',
                }}
              >
                {/* ✅ BACKGROUND IMAGE */}
                <Image
                  src={s.img}
                  alt={s.title}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  style={{ objectFit: 'cover' }}
                />

                {/* ✅ TEXT CARD */}
                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: 20,
                    maxWidth: 520,
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <h2 style={{ marginBottom: 6 }}>{s.title}</h2>
                  <p style={{ marginBottom: 10, color: '#555' }}>{s.text}</p>
                  <Link
                    href={s.cta_href}
                    style={{
                      display: 'inline-block',
                      background: '#f59e0b',
                      color: '#111827',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    {s.cta_label}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ DOTS */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  border: 'none',
                  background: i === idx ? '#334155' : '#cbd5e1',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
