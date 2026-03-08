'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../../../lib/supabaseClient';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof any>(k: string, v: any) { setForm((prev:any) => ({ ...prev, [k]: v })); }

  async function getToken() {
    const { data } = await supabaseBrowser().auth.getSession();
    return data?.session?.access_token;
  }

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.error ?? res.statusText);
        setForm(await res.json());
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load product.');
      }
    })();
  }, [id]);

  async function save() {
    setSaving(true); setErr(null);
    try {
      const token = await getToken();
      const payload = {
        name: String(form.name ?? '').trim(),
        description: form.description ?? null,
        original_price: Number(form.original_price ?? 0),
        offer_price: form.offer_price === '' || form.offer_price === null ? null : Number(form.offer_price),
        stock: Number(form.stock ?? 0),
        category: form.category ?? null,
        image: form.image ?? null
      };
      if (!payload.name) throw new Error('Name is required.');

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.error ?? res.statusText);
      await res.json();
      router.replace('/admin/products');
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  if (err) return <div style={{ padding:20, color:'#fca5a5' }}>Error: {err}</div>;
  if (!form) return <div style={{ padding:20 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Edit Product</h1>
      <div style={{ display:'grid', gap:10 }}>
        <input style={input} value={form.name ?? ''} onChange={e=>set('name', e.target.value)} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input style={input} value={form.original_price ?? ''} onChange={e=>set('original_price', e.target.value)} placeholder="Original Price" />
          <input style={input} value={form.offer_price ?? ''} onChange={e=>set('offer_price', e.target.value)} placeholder="Offer Price (optional)" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input style={input} value={form.stock ?? ''} onChange={e=>set('stock', e.target.value)} placeholder="Stock" />
          <input style={input} value={form.category ?? ''} onChange={e=>set('category', e.target.value)} placeholder="Category" />
        </div>

        <input style={input} value={form.image ?? ''} onChange={e=>set('image', e.target.value)} placeholder="Image URL" />
        <textarea style={{ ...input, minHeight: 120 }} value={form.description ?? ''} onChange={e=>set('description', e.target.value)} placeholder="Description" />

        <div style={{ display:'flex', gap:10 }}>
          <button disabled={saving} onClick={save} style={primaryBtn}>{saving ? 'Saving…' : 'Save changes'}</button>
          <button disabled={saving} onClick={()=>history.back()} style={secondaryBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const input: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0b1220', color:'#e2e8f0' };
const primaryBtn: React.CSSProperties = { background:'#2563eb', color:'#fff', padding:'10px 12px', borderRadius:8, border:'none', cursor:'pointer' };
const secondaryBtn: React.CSSProperties = { background:'#1f2937', color:'#e5e7eb', border:'1px solid #374151', borderRadius:8, padding:'10px 12px', cursor:'pointer' };
