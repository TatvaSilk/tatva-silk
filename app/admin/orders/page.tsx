import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // ensure fresh data

export default async function AdminOrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ admin access
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
        <p style={{ opacity: 0.7 }}>No orders found.</p>
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
          {/* Order Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Order No:</strong>
            <span>{order.order_no}</span>
          </div>

          {/* Status dropdown */}
          <div style={row}>
            <span>Status</span>
            <select
              value={order.status}
              onChange={async (e) => {
                await fetch(`/api/admin/orders/${order.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: e.target.value }),
                });
                location.reload(); // simple refresh
              }}
              style={{
                background: '#020617',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: 4,
                padding: '4px 6px',
              }}
            >
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment */}
          <div style={row}>
            <span>Payment</span>
            <span>{order.payment_status}</span>
          </div>

          {/* Total */}
          <div style={row}>
            <span>Total</span>
            <span>₹{order.grand_total}</span>
          </div>

          <hr style={{ borderColor: '#1f2937', margin: '12px 0' }} />

          {/* Shipping */}
          <div style={{ fontSize: 14 }}>
            <div>
              <strong>Customer:</strong> {order.shipping_name}
            </div>
            <div>
              <strong>Phone:</strong> {order.shipping_phone}
            </div>
            <div>
              <strong>Address:</strong>{' '}
              {[
                order.shipping_address_line1,
                order.shipping_city,
                order.shipping_state,
                order.shipping_pin,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>

          {/* COD Confirm button */}
          {order.payment_status === 'cod_pending' && (
            <button
              onClick={async () => {
                await fetch(`/api/admin/orders/${order.id}/payment`, {
                  method: 'PATCH',
                });
                location.reload();
              }}
              style={{
                marginTop: 12,
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              Mark Payment as Paid
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const row: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 6,
};
