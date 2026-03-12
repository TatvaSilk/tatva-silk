// app/page.tsx
import HeroBanner from '@/components/HeroBanner';
import ProductCarousel from '@/components/ProductCarousel';
import HomeFilterBar from '@/components/HomeFilterBar';

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <main style={{ padding: '12px 0 28px' }}>
        <HeroBanner />

        {/* Filter bar chips (children under a parent). 
           Change parentSlug to "sarees" / "gown" / "silk" / "punjabi-dress" as you like. */}
        <HomeFilterBar parentSlug="sarees" max={12} title="Shop by sub‑category" />

        <div style={{ height: 8 }} />

        {/* Spotlight sections */}
        <ProductCarousel
          title="Presidents' Day Sale: Save up to 40% off"
          where={{ dealOnly: true }}
          limit={12}
        />

        <ProductCarousel
          title="Banarasi picks for you"
          where={{ categoryEquals: 'banarasi' }}
          limit={12}
        />

        <ProductCarousel
          title="Soft Silk — Trending now"
          where={{ categoryEquals: 'soft-silk' }}
          limit={12}
        />
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Tatva Silk & Shubh Vivah
      </footer>
    </>
  );
}
