'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { CartLine, getCart } from '@/lib/cart';

type Product = {
  id: string;
  name: string | null;
  offer_price: number | null;
  original_price: number | null;
  product_images: { url: string | null; alt: string | null; sort_order: number | null }[] | null;
};

type QuoteRes = {
  subtotal: number;
  quote: { label: string; amount: number };
  total: number;
};

type PayResp = { upiLink: string; qrImgUrl: string };

function inr(n: number | null | undefined) {
  if (typeof n !== 'number') return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
}

function pickImage(p?: Product | null) {
  const arr = (p?.product_images ?? []) as any[];
  const valid = arr
    .filter((x) => typeof x?.url === 'string' && /^https?:\/\//i.test(x.url))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  return valid[0]?.url ?? null;
}

export default function CheckoutPage() {
  // --- cart + products ---
  const [cart, setCart] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  // --- shipping/address + quote ---
  const [addr, setAddr] = useState({ country: 'IN', state: '', city: '', pincode: '' });
  const [pricing, setPricing] = useState<QuoteRes | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // --- UPI ---
  const [upi, setUpi] = useState<PayResp | null>(null);
  const [loadingUpi, setLoadingUpi] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- customer + UTR ---
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [shipAddr, setShipAddr] = useState({ line1: '', line2: '' });
  const [utr, setUtr] = useState('');
  const [vpa, setVpa] = useState('');
  const [note, setNote] = useState('');

  const orderId = useMemo(() => `TS-${Date.now()}`, []);

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Load cart
  useEffect(() => {
    setCart(getCart());
  }, []);

  // Fetch products for price & thumbnails
  useEffect(() => {
    async function loadProducts(ids: string[]) {
      if (!ids.length) {
        setProducts({});
        return;
      }
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          original_price,
          offer_price,
          product_images ( url, alt, sort_order )
        `)
        .in('id', ids);
      if (!error && Array.isArray(data)) {
        const map: Record<string, Product> = {};
        for (const row of data as any[]) map[row.id] = row;
        setProducts(map);
      }
      setLoadingProducts(false);
    }
    loadProducts(cart.map((l) => l.productId));
  }, [cart, supabase]);

  // Compute subtotal on client (used as fallback display)
  const subtotal = useMemo(() => {
    let sum = 0;
    for (const l of cart) {
      const p = products[l.productId];
      const price =
        typeof p?.offer_price === 'number' ? p.offer_price : (p?.original_price as number | null);
      if (typeof price === 'number') sum += price * l.qty;
    }
    return sum;
  }, [cart, products]);

  // Quote shipping when cart/products or address change
  useEffect(() => {
    async function quote() {
      if (!cart.length) {
        setPricing(null);
        return;
      }
      setLoadingQuote(true);
      setQuoteError(null);

      try {
        // Build cart lines including unit price for the quote API
        const cartForQuote = cart.map((l) => {
          const p = products[l.productId];
          const price =
            typeof p?.offer_price === 'number'
              ? p.offer_price
              : (p?.original_price as number | null) || 0;
          return { productId: l.productId, name: p?.name ?? '', price, qty: l.qty };
        });

        const res = await fetch('/api/shipping/quote', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ cart: cartForQuote, address: addr }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to quote shipping');
        setPricing(data);
      } catch (e: any) {
        setQuoteError(e?.message || 'Failed to quote shipping');
        setPricing(null);
      } finally {
        setLoadingQuote(false);
      }
    }
    quote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cart), JSON.stringify(products), JSON.stringify(addr)]);

  const totalINR = pricing?.total ?? subtotal;

  // Prepare UPI when total is known
  async function createUpi() {
    try {
      if (!totalINR || totalINR <= 0) return;
      setLoadingUpi(true);
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
      setLoadingUpi(false);
    }
  }

  // Re‑generate UPI whenever total changes
  useEffect(() => {
    if (totalINR > 0) createUpi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalINR]);

  // Place order with UTR
  async function placeOrder() {
    try {
      if (!utr.trim()) return setErr('Please enter the UPI Reference (UTR).');
      setErr(null);

      const items = cart.map((l) => {
        const p = products[l.productId];
        const price =
          typeof p?.offer_price === 'number' ? p.offer_price : (p?.original_price as number | null) || 0;
        return { productId: l.productId, name: p?.name ?? '', price, qty: l.qty };
      });

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items,
          amount: totalINR,
          customer,
          address: {
            ...shipAddr,
            country: addr.country,
            state: addr.state,
            city: addr.city,
            pincode: addr.pincode,
          },
          upi: { utr: utr.trim(), vpa: vpa.trim() || null, note: note || null },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Order create failed');

      // (Optional) Clear cart now or after you confirm payment manually
      localStorage.setItem('cart', '[]');

      // Redirect to a thank-you page
      window.location.href = `/thank-you?order=${encodeURIComponent(data.orderNo)}`;
    } catch (e: any) {
      setErr(e?.message || 'Failed to place order');
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px' }}>
      <h1>Checkout</h1>

      {!cart.length ? (
        <p>
          Your cart is empty. <Link href="/products">Continue shopping →</Link>
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* LEFT: Address + Shipping + Totals */}
          <section>
            <h3>Shipping</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                placeholder="Country (e.g., IN)"
                value={addr.country}
                onChange={(e) => setAddr({ ...addr, country: e.target.value })}
              />
              <input
                placeholder="State"
                value={addr.state}
                onChange={(e) => setAddr({ ...addr, state: e.target.value })}
              />
              <input
                placeholder="City"
                value={addr.city}
                onChange={(e) => setAddr({ ...addr, city: e.target.value })}
              />
              <input
                placeholder="Pincode"
                value={addr.pincode}
                onChange={(e) => setAddr({ ...addr, pincode: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <strong>{inr(pricing?.subtotal ?? subtotal)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{pricing?.quote?.label || 'Shipping'}</span>
                <strong>{inr(pricing?.quote?.amount ?? 0)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total</span>
                <strong>{inr(totalINR)}</strong>
              </div>

              {loadingQuote ? (
                <div style={{ color: '#6b7280', fontSize: 12 }}>Updating shipping…</div>
              ) : quoteError ? (
                <div style={{ color: 'crimson', fontSize: 12 }}>{quoteError}</div>
              ) : null}
            </div>

            <h3 style={{ marginTop: 16 }}>Contact & Address</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <input
                placeholder="Full name"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
              <input
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
              <input
                placeholder="Email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
              <input
                placeholder="Address line 1"
                value={shipAddr.line1}
                onChange={(e) => setShipAddr({ ...shipAddr, line1: e.target.value })}
              />
              <input
                placeholder="Address line 2"
                value={shipAddr.line2}
                onChange={(e) => setShipAddr({ ...shipAddr, line2: e.target.value })}
              />
            </div>

            {/* (Optional) Show a compact cart preview */}
            <div style={{ marginTop: 16 }}>
              <h4>Items</h4>
              {loadingProducts ? (
                <div style={{ color: '#6b7280' }}>Loading items…</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                  {cart.map((l) => {
                    const p = products[l.productId];
                    const img = pickImage(p);
                    return (
                      <li key={l.productId} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 10 }}>
                        <div style={{ width: 60, height: 60, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                          {img ? (
                            <Image src={img} alt={p?.name ?? 'Product'} fill sizes="60px" style={{ objectFit: 'cover' }} />
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{p?.name ?? 'Product'}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>Qty: {l.qty}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                          {inr(
                            (typeof p?.offer_price === 'number' ? p.offer_price : (p?.original_price as number | null)) ??
                              0
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* RIGHT: Pay by UPI + UTR capture */}
          <section>
            <h3>Pay by UPI</h3>
            <p>
              Amount to pay: <strong>{inr(totalINR)}</strong>
            </p>

            {err ? <p style={{ color: 'crimson' }}>{err}</p> : null}

            {loadingUpi || !upi ? (
              <div
                style={{
                  padding: 10,
                  background: '#f3f4f6',
                  borderRadius: 8,
                  display: 'inline-block',
                  minWidth: 260,
                  textAlign: 'center',
                }}
              >
                Preparing UPI…
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
                {/* QR via image */}
                <img
                  alt="UPI QR"
                  src={upi.qrImgUrl}
                  width={260}
                  height={260}
                  style={{
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 10,
                    padding: 12,
                    boxSizing: 'content-box',
                  }}
                />

                {/* Deep‑link open */}
                <a
                  href={upi.upiLink}
                  style={{
                    background: '#0ea5e9',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Open in UPI app
                </a>

                <button
                  onClick={() => navigator.clipboard.writeText(upi.upiLink)}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    width: 260,
                  }}
                >
                  Copy UPI link
                </button>

                <small style={{ color: '#6b7280' }}>
                  Open on mobile → choose GPay / PhonePe / Paytm / BHIM → confirm &amp; pay.
                </small>
              </div>
            )}

            <h4 style={{ marginTop: 16 }}>Confirm UPI payment</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <input placeholder="UPI Reference (UTR)" value={utr} onChange={(e) => setUtr(e.target.value)} />
              <input placeholder="Payer UPI ID (optional)" value={vpa} onChange={(e) => setVpa(e.target.value)} />
              <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

              <button
                onClick={placeOrder}
                style={{
                  background: '#f59e0b',
                  color: '#111827',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Place Order
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
