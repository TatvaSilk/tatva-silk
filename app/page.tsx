// app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Tatva Silk &amp; Shubh Vivah</h1>
      <p style={{ color: '#444', marginBottom: 16 }}>
        An Ethnic Grace — Saree • Chaniya Choli • Kurti
      </p>

      {/* ✅ Direct link to the products list */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/products"
          style={{
            color: '#2563eb',
            textDecoration: 'none',
            border: '1px solid #e5e7eb',
            padding: '8px 12px',
            borderRadius: 8,
            display: 'inline-block'
          }}
        >
          View Products →
        </Link>
      </div>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16
        }}
      >
        <Card title="Saree" />
        <Card title="Chaniya Choli" />
        <Card title="Kurti" />
        <Card title="Offers" />
      </section>

      <footer style={{ marginTop: 40, color: '#666' }}>
        © {new Date().getFullYear()} Tatva Silk &amp; Shubh Vivah
      </footer>
    </main>
  )
}

function Card({ title }: { title: string }) {
  return (
    <div style={{ border: '1px solid #eaeaea', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ margin: 0, color: '#666' }}>Coming soon…</p>
    </div>
  )
}
