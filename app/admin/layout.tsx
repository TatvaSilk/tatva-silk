// app/admin/layout.tsx
import Link from 'next/link'
import Guard from './_components/Guard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Guard allowed={['admin', 'manager']}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          minHeight: '100dvh',
        }}
      >
        <aside style={{ background: '#0f172a', color: '#fff', padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>
            TatvaSilk Admin
          </div>

          <nav style={{ display: 'grid', gap: 6 }}>
            <Link href="/admin" style={linkStyle}>
              Dashboard
            </Link>

            <Link href="/admin/products" style={linkStyle}>
              Products
            </Link>

            <Link href="/admin/categories" style={linkStyle}>
              Categories
            </Link>

            {/* ✅ NEW: Banner Management */}
            <Link href="/admin/banners" style={linkStyle}>
              Home Banners
            </Link>

            <Link href="/admin/orders" style={linkStyle}>
              Orders
            </Link>

            <Link href="/admin/users" style={linkStyle}>
              Users
            </Link>

            <Link href="/admin/settings" style={linkStyle}>
              Settings
            </Link>

            <Link
              href="/logout"
              style={{ ...linkStyle, color: '#fda4af' }}
            >
              Logout
            </Link>
          </nav>
        </aside>

        <section style={{ background: '#0b0f1a', color: '#e2e8f0' }}>
          <header
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #1f2937',
            }}
          >
            <span style={{ opacity: 0.8 }}>Admin Panel</span>
          </header>

          <div style={{ padding: 20 }}>{children}</div>
        </section>
      </div>
    </Guard>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 10px',
  color: '#cbd5e1',
  textDecoration: 'none',
  borderRadius: 6,
}
