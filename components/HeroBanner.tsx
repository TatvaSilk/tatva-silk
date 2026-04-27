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
  mobile_img?: string
  gradient_color?: string
  theme?: 'dark' | 'light'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HeroBanner() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [idx, setIdx] = useState(0)
  const timer = useRef<NodeJS.Timeout | null>(null)

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768

  const total = slides.length

  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setSlides(data)
      })
  }, [])

  // ✅ FIXED useEffect (no null return)
  useEffect(() => {
    if (total > 1) {
      timer.current = setInterval(() => {
        setIdx(i => (i + 1) % total)
      }, 4500)
    }

    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [total])

  if (!slides.length) return null

  const s = slides[idx]
  const imageSrc =
    isMobile && s.mobile_img ? s.mobile_img : s.img

  const dark = s.theme !== 'light'
  const gradient = s.gradient_color || '#0b1220'

  return (
    <div style={{ maxWidth: 1200, margin: '20px auto' }}>
      <div
        style={{
          position: 'relative',
          height: 340,                 // ✅ SMALLER HEIGHT
          borderRadius: 14,
          overflow: 'hidden',
          background: gradient,
        }}
      >
        <Image
          src={imageSrc}
          alt={s.title}
          fill
          priority
          sizes="(max-width:768px) 100vw, 1200px"
          style={{
            objectFit: 'contain',      // ✅ NO CROP
          }}
        />

        {/* ✅ GRADIENT OVERLAY */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              90deg,
              ${gradient}ee 0%,
              ${gradient}99 45%,
              transparent 75%
            )`,
          }}
        />

        {/* ✅ TEXT CONTENT */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: 460,
            color: dark ? '#f8fafc' : '#111827',
          }}
        >
          <h2 style={{ marginBottom: 6 }}>{s.title}</h2>
          <p style={{ marginBottom: 14 }}>{s.text}</p>

          <Link href={s.cta_href}>
            <button
              style={{
                background: '#f59e0b',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {s.cta_label}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
