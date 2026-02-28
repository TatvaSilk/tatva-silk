// app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main
      style={{
        padding: '40px 24px',
        maxWidth: 1080,
        margin: '0 auto',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Heading */}
      <h1
        style={{
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: -0.2,
          marginBottom: 6,
        }}
      >
        Tatva Silk &amp; Shubh Vivah
      </h1>

      {/* Subheading */}
      <p style={{ color: '#495057', marginBottom: 16 }}>
        An Ethnic Grace — Saree • Chaniya Choli • Kurti
      </p>

      {/* View Products button */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/products"
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            background: '#2563eb',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            border: '1px solid #1d4ed8',
            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
          }}
        >
          View Products →
        </Link>
      </div>

      {/* Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <Card title="Saree" />
        <Card title="Chaniya Choli" />
        <Card title="Kurti" />
        <Card title="Offers" />
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 40, color: '#666' }}>
        © {new Date().getFullYear()} Tatva Silk &amp; Shubh Vivah
      </footer>
    </main>
  )
}

function Card({ title }: { title: string }) {
  return (
    <div
      style={{
        border: '1px solid #e9ecef',
        borderRadius: 10,
        padding: 16,
        background: '#fff',
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
      }}
    >
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{title}</h3>
      <p style={{ margin: 0, color: '#6c757d' }}>Coming soon...</p>
    </div>
  )
}
