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
    <div style={{ maxWidth: 1200, margin: '20px auto' }}>
      <div onMouseEnter={stop} onMouseLeave={start}>
        <div
          style={{
            position: 'relative',
            maxHeight: 420,
            minHeight: 260,
            overflow: 'hidden',
            borderRadius: 14,
            background: '#0b1220', // ✅ dark base
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
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* ✅ IMAGE */}
                <Image
                  src={s.img}
                  alt={s.title}
                  width={1200}
                  height={600}
                  style={{
                    maxHeight: 420,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'brightness(0.92)', // ✅ slight dim
                  }}
                  priority
                />

                {/* ✅ GRADIENT OVERLAY */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, rgba(11,18,32,0.85) 0%, rgba(11,18,32,0.45) 40%, rgba(11,18,32,0) 70%)',
                  }}
                />

                {/* ✅ TEXT CONTENT */}
                <div
                  style={{
                    position: 'absolute',
                    left: 32,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    maxWidth: 460,
                    color: '#f8fafc',
                  }}
                >
                  <h2 style={{ marginBottom: 8 }}>{s.title}</h2>
                  <p style={{ marginBottom: 14, color: '#cbd5e1' }}>
                    {s.text}
                  </p>
                  <Link href={s.cta_href}>
                    <button
                      style={{
                        background: '#f59e0b',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: '#111827',
                      }}
                    >
                      {s.cta_label}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ DOTS */}
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
                    background: i === idx ? '#f59e0b' : '#64748b',
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
