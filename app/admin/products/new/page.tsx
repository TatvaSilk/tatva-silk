'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../../../lib/supabaseClient';

type Cat = { id: string; slug: string; label: string; parent_id: string | null };

export default function NewProductPage() {
  const [form, setForm] = useState({
    name: '',
    original_price: '',
    offer_price: '',
    stock: '',
    category_parent_id: '',   // parent (e.g., Sarees)
    category_id: '',          // subcategory (e.g., Banarasi)
    image_url: '',            // optional primary image URL
    description: ''
  });

  const [parents, setParents] = useState<Cat[]>([]);
  const [children, setChildren] = useState<Cat[]>([]);
  const [files, setFiles] = useState<File[]>([]); // additional images from device
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  // Load PARENT categories (parent_id=null)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/categories', { cache: 'no-store' });
        if (!res.ok) return;
        const all: Cat[] = await res.json();
        const ps = all.filter(c => c.parent_id === null);
        setParents(ps);
      } catch {}
    })();
  }, []);

  // When parent changes, load CHILDREN (server-filtered)
  useEffect(() => {
    (async () => {
      if (!form.category_parent_id) {
        setChildren([]);
        set('category_id', '');
        return;
      }
      const res = await fetch(`/api/admin/categories?parent_id=${form.category_parent_id}`, { cache: 'no-store' });
      if (res.ok) {
        const kids: Cat[] = await res.json();
        setChildren(kids);
        // reset child if current not in list
        if (!kids.find(c => c.id === form.category_id)) {
          set('category_id', '');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category_parent_id]);

  async function getToken() {
    const { data } = await supabaseBrowser().auth.getSession();
    return data?.session?.access_token;
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles(prev => [...prev, ...picked]);
    e.target.value = '';
  }

  // Uploads files to the public bucket and returns public URLs
  async function uploadFilesToStorage(productId: string): Promise<string[]> {
    if (!files.length) return [];
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
    return urls;
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('unauthenticated');

      const payload = {
        name: form.name.trim(),
        original_price: Number(form.original_price || 0),
        offer_price: form.offer_price === '' ? null : Number(form.offer_price),
        stock: Number(Number.isInteger(+form.stock) ? form.stock : 0),
        category_id: form.category_id || null,         // save the SUBCATEGORY id
        image_url: form.image_url.trim() || null,      // optional primary image URL
        description: form.description.trim() || null
      };

      if (!payload.name) throw new Error('Name is required.');
      if (Number.isNaN(payload.original_price) || payload.original_price < 0) {
        throw new Error('Original price is invalid.');
      }
      if (payload.offer_price !== null && (Number.isNaN(payload.offer_price) || payload.offer_price < 0)) {
        throw new Error('Offer price is invalid.');
      }
      if (payload.stock < 0 || Number.isNaN(payload.stock)) {
        throw new Error('Stock is invalid.');
      }
      // Optional: require a subcategory selection
      // if (!payload.category_id) throw new Error('Please select a subcategory.');

      // 1) Create the product
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? res.statusText);
      }
      const created = await res.json(); // contains created.id

      // 2) Upload any device-picked images and attach them
      if (files.length) {
        const urls = await uploadFilesToStorage(created.id);
        if (urls.length) {
          await fetch(`/api/admin/products/${created.id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ urls })
          });
        }
      }

      router.replace('/admin/products');
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>New Product</h1>

      <div style={{ display: 'grid', gap: 10 }}>
        <input
          style={input}
          placeholder="Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            style={input}
            placeholder="Original Price (e.g., 100)"
            value={form.original_price}
            onChange={e => set('original_price', e.target.value)}
          />
          <input
            style={input}
            placeholder="Offer Price (optional)"
            value={form.offer_price}
            onChange={e => set('offer_price', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            style={input}
            placeholder="Stock (e.g., 10)"
            value={form.stock}
            onChange={e => set('stock', e.target.value)}
          />

          {/* PARENT category dropdown (e.g., Sarees) */}
          <select
            style={input}
            value={form.category_parent_id}
            onChange={e => set('category_parent_id', e.target.value)}
          >
            <option value="">-- Select category --</option>
            {parents.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* SUBCATEGORY dropdown (e.g., Banarasi) */}
        <select
          style={input}
          value={form.category_id}
          onChange={e => set('category_id', e.target.value)}
          disabled={!children.length}
        >
          <option value="">
            {children.length ? '-- Select subcategory --' : 'Select category first'}
          </option>
          {children.map(c => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Optional primary image URL (sort_order=1 if none exists) */}
        <input
          style={input}
          placeholder="Primary Image URL (optional)"
          value={form.image_url}
          onChange={e => set('image_url', e.target.value)}
        />

        {/* Multi-file picker from device (uploads to Storage on save) */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ ...secondaryBtn, cursor: 'pointer' }}>
            Upload more images…
            <input type="file" multiple accept="image/*" onChange={onPickFiles} style={{ display: 'none' }} />
          </label>
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            {files.length ? `${files.length} file(s) selected` : 'No files selected'}
          </span>
        </div>

        {/* Previews */}
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

        <textarea
          style={{ ...input, minHeight: 120 }}
          placeholder="Description (optional)"
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={saving} onClick={save} style={primaryBtn}>
            {saving ? 'Saving…' : 'Save product'}
          </button>
          <button disabled={saving} onClick={() => history.back()} style={secondaryBtn}>
            Cancel
          </button>
        </div>

        {err && <div style={{ color: '#fca5a5' }}>Error: {err}</div>}
      </div>
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0b1220',
  color: '#e2e8f0'
};
const primaryBtn: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px 12px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
};
const secondaryBtn: React.CSSProperties = {
  background: '#1f2937',
  color: '#e5e7eb',
  border: '1px solid #374151',
  borderRadius: 8,
  padding: '10px 12px',
  cursor: 'pointer'
};
