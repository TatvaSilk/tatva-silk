'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../../../lib/supabaseClient';

type Cat = { id: string; slug: string; label: string; parent_id: string | null };

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<any>(null);
  const [parents, setParents] = useState<Cat[]>([]);
  const [children, setChildren] = useState<Cat[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof any>(k: string, v: any) {
    setForm((prev: any) => ({ ...prev, [k]: v }));
  }

  async function getToken() {
    const { data } = await supabaseBrowser().auth.getSession();
    return data?.session?.access_token;
  }

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('unauthenticated');
        const res = await fetch(`/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error ?? res.statusText);
        }
        const data = await res.json();
        setForm({
          ...data,                       // includes category_id
          image_url: data.primary_image_url ?? '',
          category_parent_id: ''         // derived next
        });
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load product.');
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/categories', { cache: 'no-store' });
        if (!res.ok) return;
        const all: Cat[] = await res.json();
        const ps = all.filter(c => c.parent_id === null);
        setParents(ps);

        if (form?.category_id) {
          const current = all.find(c => c.id === form.category_id);
          const parentId = current?.parent_id ?? '';
          set('category_parent_id', parentId);
          setChildren(all.filter(c => c.parent_id === parentId));
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.category_id]);

  useEffect(() => {
    (async () => {
      if (!form?.category_parent_id) {
        setChildren([]);
        set('category_id', '');
        return;
      }
      const res = await fetch(`/api/admin/categories?parent_id=${form.category_parent_id}`, { cache: 'no-store' });
      if (res.ok) {
        const kids: Cat[] = await res.json();
        setChildren(kids);
        if (!kids.find(c => c.id === form.category_id)) {
          set('category_id', '');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.category_parent_id]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles(prev => [...prev, ...picked]);
    e.target.value = '';
  }

  async function uploadFilesToStorage(productId: string, token: string) {
    if (!files.length) return;
    const supabase = supabaseBrowser();
    const bucket = supabase.storage.from('product-images');
    const urls: string[] = [];
    for (const f of files) {
      const path = `products/${productId}/${Date.now()}-${f.name}`;
      const { error: upErr } = await bucket.upload(path, f, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = bucket.getPublicUrl(path);
      if (pub?.publicUrl) urls.push(pub.publicUrl);
    }
    if (urls.length) {
      await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls })
      });
    }
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('unauthenticated');

      const payload = {
        name: String(form.name ?? '').trim(),
        description: form.description ?? null,
        original_price: Number(form.original_price ?? 0),
        offer_price: form.offer_price === '' || form.offer_price === null ? null : Number(form.offer_price),
        stock: Number(form.stock ?? 0),
        category_id: form.category_id || null,  // save child id
        image_url: form.image_url === '' || form.image_url === null ? null : String(form.image_url).trim()
      };

      if (!payload.name) throw new Error('Name is required.');

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? res.statusText);
      }
      await res.json();

      await uploadFilesToStorage(id as string, token);

      router.replace('/admin/products');
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  if (err) return <div style={{ padding: 20, color: '#fca5a5' }}>Error: {err}</div>;
  if (!form) return <div style={{ padding: 20 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Edit Product</h1>
      <div style={{ display: 'grid', gap: 10 }}>
        <input style={input} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Name" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input style={input} value={form.original_price ?? ''} onChange={e => set('original_price', e.target.value)} placeholder="Original Price" />
          <input style={input} value={form.offer_price ?? ''} onChange={e => set('offer_price', e.target.value)} placeholder="Offer Price (optional)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input style={input} value={form.stock ?? ''} onChange={e => set('stock', e.target.value)} placeholder="Stock" />
          <select style={input} value={form.category_parent_id ?? ''} onChange={e => set('category_parent_id', e.target.value)}>
            <option value="">-- Select category --</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        <select style={input} value={form.category_id ?? ''} onChange={e => set('category_id', e.target.value)} disabled={!children.length}>
          <option value="">{children.length ? '-- Select subcategory --' : 'Select category first'}</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>

        <input style={input} value={form.image_url ?? ''} onChange={e => set('image_url', e.target.value)} placeholder="Primary Image URL (optional)" />

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ ...secondaryBtn, cursor: 'pointer' }}>
            Upload more images…
            <input type="file" multiple accept="image/*" onChange={onPickFiles} style={{ display: 'none' }} />
          </label>
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            {files.length ? `${files.length} file(s) selected` : 'No files selected'}
          </span>
        </div>

        {files.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {files.map((f, i) => (
              <div key={i} style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', background: '#111827' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" width={80} height={80} style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        <textarea style={{ ...input, minHeight: 120 }} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Description" />

        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={saving} onClick={save} style={primaryBtn}>{saving ? 'Saving…' : 'Save changes'}</button>
          <button disabled={saving} onClick={() => history.back()} style={secondaryBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0b1220', color: '#e2e8f0' };
const primaryBtn: React.CSSProperties = { background: '#2563eb', color: '#fff', padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' };
const secondaryBtn: React.CSSProperties = { background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' };
