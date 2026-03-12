'use client';

import { useEffect, useState } from 'react';

type PayResp = { upiLink: string; qrSvg: string };

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [upi, setUpi] = useState<PayResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // TODO: compute real total from your cart
  const totalINR = 2159.00;
  const orderId = `TS-${Date.now()}`;

  async function createUpi() {
    try {
      setLoading(true);
      setErr(null);
      setUpi(null);

      const res = await fetch('/api/pay/upi', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: totalINR, orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create UPI payment');

      setUpi(data);
    } catch (e: any) {
      setErr(e?.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    createUpi(); // create link on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1>Checkout</h1>
      <p>Amount to pay: <strong>₹{totalINR.toLocaleString('en-IN')}</strong></p>

      {err ? <p style={{ color: 'crimson' }}>{err}</p> : null}

      {loading || !upi ? (
        <button disabled style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: '#e5e7eb', color: '#111' }}>
          Preparing UPI…
        </button>
      ) : (
        <div style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
          {/* QR */}
          <div
            dangerouslySetInnerHTML={{ __html: upi.qrSvg }}
            style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 12, width: 260 }}
          />

          {/* Deep-link open */}
          <a
            href={upi.upiLink}
            style={{ background: '#0ea5e9', color: '#fff', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, textAlign: 'center' }}
          >
            Pay with any UPI app
          </a>

          <button
            onClick={() => navigator.clipboard.writeText(upi.upiLink)}
            style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', width: 260 }}
          >
            Copy UPI link
          </button>

          <small style={{ color: '#6b7280' }}>
            Open the link on your phone, choose GPay / PhonePe / Paytm / BHIM, confirm and pay.
          </small>
        </div>
      )}
    </main>
  );
}
