// components/AutoScrollRow.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  /** pixels per second; default ~40 (nice and gentle) */
  speed?: number
}

/**
 * A lightweight auto-scrolling horizontal row.
 * - Pauses on hover/touch/focus
 * - Loops back to start when reaching the end
 * - No external libraries
 */
export default function AutoScrollRow({ children, className, speed = 40 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    function step(ts: number) {
      if (!ref.current) return
      if (paused) {
        lastTsRef.current = ts
        rafRef.current = requestAnimationFrame(step)
        return
      }
      const el = ref.current
      const last = lastTsRef.current ?? ts
      const dt = Math.max(0, (ts - last) / 1000) // seconds
      lastTsRef.current = ts

      // Move by (speed px / second)
      const dx = speed * dt
      el.scrollLeft += dx

      // If reached end (within 1px), jump back to start
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        el.scrollTo({ left: 0 })
      }

      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [speed, paused])

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      tabIndex={0}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-live="off"
      style={{ scrollBehavior: 'auto' }} // we control movement; no smooth conflict
    >
      {children}
    </div>
  )
}
