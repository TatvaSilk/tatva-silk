// app/page.tsx
import HeroBanner from '@/components/HeroBanner'
import ProductCarousel from '@/components/ProductCarousel'

export const revalidate = 60

export default function Home() {
  return (
    <>
      <main style={{ padding: '12px 0 28px' }}>
        <HeroBanner />
        <div style={{ height: 8 }} />
        <ProductCarousel title="Presidents' Day Sale: Save up to 40% off" where={{ dealOnly: true }} limit={12} />
        <ProductCarousel title="Banarasi picks for you" where={{ categoryEquals: 'banarasi' }} limit={12} />
        <ProductCarousel title="Soft Silk — Trending now" where={{ categoryEquals: 'soft-silk' }} limit={12} />
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Tatva Silk &amp; Shubh Vivah
      </footer>
    </>
  )
}
