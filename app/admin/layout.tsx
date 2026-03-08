import Guard from './_components/Guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard allowed={['admin', 'manager']}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100dvh' }}>
        <aside style={{ background: '#0f172a', color: '#fff', padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>TatvaSilk Admin</div>
          <nav style={{ display: 'grid', gap: 6 }}>
            /adminDashboard</a>
            /admin/productsProducts</a>
            /admin/ordersOrders</a>
            /admin/usersUsers</a>
            /admin/settingsSettings</a>
          </nav>
        </aside>
        <section style={{ background: '#0b0f1a', color: '#e2e8f0' }}>
          <header style={{ padding: '14px 20px', borderBottom: '1px solid #1f2937' }}>
            <span style={{ opacity: 0.8 }}>Admin Panel</span>
          </header>
          <div style={{ padding: 20 }}>{children}</div>
        </section>
      </div>
    </Guard>
  );
}
