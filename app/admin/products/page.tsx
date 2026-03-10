'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '../../../lib/supabaseClient';

type Row = {
  id: string;
  name: string;
  original_price: number | null;
  offer_price: number | null;
  stock: number;
  category_id: string | null;
  category_label?: string | null;
  primary_image_url?: string | null;
  created_at: string | null;
};

export default function ProductsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function getToken() {
    const { data } = await supabaseBrowser().auth.getSession();
    return data?.session?.access_token;
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('unauthenticated');
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await safeMsg(res));
      setRows(await res.json());
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load products.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      if (!token) throw new Error('unauthenticated');
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await safeMsg(res));
      await load();
    } catch (e: any) {
      alert(e?.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading products…</div>;
  if (err) return <div style={{ padding: 20, color: '#fca5a5' }}>Error: {err}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Products</h1>
        <Link href="/admin/products/new" style={primaryBtn}>New product</Link>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 20, opacity: 0.7 }}>No products yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#111827' }}>
                <th style={th}>Name</th>
                <th style={th}>Price</th>
                <th style={th}>Stock</th>
                <th style={th}>Category</th>
                <th style={th}>Created</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const price = Number(p.offer_price ?? p.original_price ?? 0);
                const original = Number(p.original_price ?? 0);
                const hasOffer = p.offer_price != null;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.primary_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.primary_image_url} alt="" width={40} height={40} style={{ borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: '#1f2937' }} />
                        )}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td style={td}>
                      {hasOffer ? (
                        <>
                          <span style={{ textDecoration: 'line-through', opacity: 0.7, marginRight: 8 }}>
                            ₹{original.toFixed(2)}
                          </span>
                          <strong>₹{price.toFixed(2)}</strong>
                        </>
                      ) : (
                        <>₹{price.toFixed(2)}</>
                      )}
                    </td>
                    <td style={td}>{p.stock}</td>
                    <td style={td}>{p.category_label ?? '—'}</td>
                    <td style={td}>{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Link href={`/admin/products/${p.id}`} style={secondaryBtn}>Edit</Link>
                        <button onClick={() => remove(p.id)} disabled={deletingId === p.id} style={secondaryBtn}>
                          {deletingId === p.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

async function safeMsg(res: Response) {
  try { const j = await res.json(); return j?.error ?? res.statusText; } catch { return res.statusText; }
}
const th: React.CSSProperties = { padding: '10px 8px', fontWeight: 600, fontSize: 12, color: '#cbd5e1' };
const td: React.CSSProperties = { padding: '10px 8px' };
const primaryBtn: React.CSSProperties = { background: '#2563eb', color: '#fff', padding: '8px 10px', borderRadius: 6, textDecoration: 'none' };
const secondaryBtn: React.CSSProperties = { background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', textDecoration: 'none' };
