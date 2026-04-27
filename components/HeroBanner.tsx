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

  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setSlides(data ?? []))
  }, [])

  useEffect(() => {
    if (slides.length > 1) start()
    return stop
  }, [idx, slides.length])

  if (!slides.length) return null

  return (
    <div style={{ maxWidth: 1200, margin: '16px auto' }}>
      <div onMouseEnter={stop} onMouseLeave={start}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: `${total * 100}%`,
              transform: `translateX(-${idx * (100 / total)}%)`,
              transition: 'transform 0.6s ease',
            }}
          >
            {slides.map(s => (
              <div
                key={s.id}
                style={{
                  minWidth: `${100 / total}%`,
                  position: 'relative',
                  background: '#f9fafb',
                }}
              >
                {/* ✅ IMAGE DEFINES HEIGHT */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <Image
                    src={s.img}
                    alt={s.title}
                    width={1200}
                    height={800}          // ✅ auto scales correctly
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                    priority
                  />
                </div>

                {/* ✅ TEXT OVERLAY */}
                <div
                  style={{
                    position: 'absolute',
                    top: 24,
                    left: 24,
                    maxWidth: 520,
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 10,
                    padding: 18,
                  }}
                >
                  <h2 style={{ marginBottom: 6 }}>{s.title}</h2>
                  <p style={{ marginBottom: 12, color: '#555' }}>{s.text}</p>
                  <Link href={s.cta_href}>
                    <button
                      style={{
                        background: '#f59e0b',
                        border: 'none',
                        padding: '9px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {s.cta_label}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* DOTS */}
          {slides.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 14,
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
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: 'none',
                    background: i === idx ? '#334155' : '#cbd5e1',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
``
