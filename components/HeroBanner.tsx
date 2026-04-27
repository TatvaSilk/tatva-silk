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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = slides.length

  function go(to: number) {
    if (!total) return
    setIdx(((to % total) + total) % total)
  }

  function start() {
    stop()
    timerRef.current = setInterval(() => go(idx + 1), 4500)
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  // ✅ load banners
  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) {
          console.error('Hero banner error:', error)
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
    <div style={{ maxWidth: 1200, margin: '16px auto' }}>
      <div onMouseEnter={stop} onMouseLeave={start}>
        <div
          style={{
            position: 'relative',
            height: 320,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: `${total * 100}%`,
              height: '100%',
              transform: `translateX(-${idx * (100 / total)}%)`,
              transition: 'transform 0.6s ease',
            }}
          >
            {slides.map((s) => (
              <div
                key={s.id}
                style={{
                  minWidth: `${100 / total}%`,
                  position: 'relative',
                }}
              >
                {/* ✅ IMAGE RENDERED CORRECTLY */}
                {s.img}vw, 1200px"
                  style={{ objectFit: 'cover' }}
                  priority
                />

                {/* ✅ TEXT CARD */}
                <div
                  style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    maxWidth: 520,
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <h2 style={{ marginBottom: 6 }}>{s.title}</h2>
                  <p style={{ marginBottom: 10, color: '#555' }}>
                    {s.text}
                  </p>
                  {s.cta_href}
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
              bottom: 12,
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
                  background: i === idx ? '#334155' : '#cbd5e1',
                  border: 'none',
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
