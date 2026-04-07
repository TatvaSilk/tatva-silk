import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Orders</h1>
        <p style={{ color: '#f87171' }}>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Orders</h1>

      {orders.length === 0 && (
        <p style={{ opacity: 0.7 }}>No orders yet.</p>
      )}

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: '1px solid #334155',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            background: '#020617',
          }}
        >
          <div><strong>Order No:</strong> {order.order_no}</div>
          <div><strong>Status:</strong> {order.status}</div>
          <div><strong>Payment:</strong> {order.payment_status}</div>
          <div><strong>Total:</strong> ₹{order.grand_total}</div>

          <hr style={{ borderColor: '#1f2937', margin: '12px 0' }} />

          <div>
            <strong>Customer:</strong> {order.shipping_name}<br />
            <strong>Phone:</strong> {order.shipping_phone}<br />
            <strong>Address:</strong>{' '}
            {[order.shipping_address_line1, order.shipping_city, order.shipping_state, order.shipping_pin]
              .filter(Boolean)
              .join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}
