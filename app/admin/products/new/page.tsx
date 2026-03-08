'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../../../lib/supabaseClient';

export default function NewProductPage() {
  const [form, setForm] = useState({ name:'', price:'', stock:'', category:'', image:'', description:'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof typeof form>(k: K, v: string) { setForm(prev => ({ ...prev, [k]: v })); }

  async function getToken() {
    const { data } = await supabaseBrowser().auth.getSession();
    return data?.session?.access_token;
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('unauthenticated');

      const payload = {
        name: form.name.trim(),
        price: Number(form.price || 0),
        stock: Number(Number.isInteger(+form.stock) ? form.stock : 0),
        category: form.category.trim() || null,
        image: form.image.trim() || null,
        description: form.description.trim() || null
      };
      if (!payload.name) throw new Error('Name is required.');
      if (payload.price < 0 || Number.isNaN(payload.price)) throw new Error('Price is invalid.');
      if (payload.stock < 0 || Number.isNaN(payload.stock)) throw new Error('Stock is invalid.');

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.error ?? res.statusText);
      }
      await res.json();
      router.replace('/admin/products');
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>New Product</h1>
      <div style={{ display:'grid', gap:10 }}>
        <input style={input} placeholder="Name" value={form.name} onChange={e=>set('name', e.target.value)} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input style={input} placeholder="Price (49.99)" value={form.price} onChange={e=>set('price', e.target.value)} />
          <input style={input} placeholder="Stock (10)" value={form.stock} onChange={e=>set('stock', e.target.value)} />
        </div>
        <input style={input} placeholder="Category (optional)" value={form.category} onChange={e=>set('category', e.target.value)} />
        <input style={input} placeholder="Image URL (optional)" value={form.image} onChange={e=>set('image', e.target.value)} />
        <textarea style={{ ...input, minHeight: 120 }} placeholder="Description (optional)" value={form.description} onChange={e=>set('description', e.target.value)} />
        <div style={{ display:'flex', gap:10 }}>
          <button disabled={saving} onClick={save} style={primaryBtn}>{saving ? 'Saving…' : 'Save product'}</button>
          <button disabled={saving} onClick={()=>history.back()} style={secondaryBtn}>Cancel</button>
        </div>
        {err && <div style={{ color:'#fca5a5' }}>Error: {err}</div>}
      </div>
    </div>
  );
}

const input: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0b1220', color:'#e2e8f0' };
const primaryBtn: React.CSSProperties = { background:'#2563eb', color:'#fff', padding:'10px 12px', borderRadius:8, border:'none', cursor:'pointer' };
const secondaryBtn: React.CSSProperties = { background:'#1f2937', color:'#e5e7eb', border:'1px solid #374151', borderRadius:8, padding:'10px 12px', cursor:'pointer' };
