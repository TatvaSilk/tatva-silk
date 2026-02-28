// components/HeroBanner.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function HeroBanner() {
  return (
    <div className="container" style={{ marginTop: 14, marginBottom: 16 }}>
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h2>Fast shipping on beautiful silk sarees</h2>
            <p>Discover Tatva Silk collections curated from Billimora, Navsari.</p>
            /productsShop Now</Link>
          </div>
          <div style={{ position: 'relative', minHeight: 220 }}>
            https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=80&auto=format&fit=crop
          </div>
        </div>
      </div>
    </div>
  )
}
