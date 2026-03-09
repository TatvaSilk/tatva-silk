'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../../lib/supabaseClient';

type Cat = { id: string; label: string; slug: string; parent_id: string | null };

export default function CategoriesAdminPage() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newParent, setNewParent] = useState({ label: '', slug: '' });
  const [newChild, setNewChild] = useState<Record<string, { label: string; slug: string }>>({}); // by parent id

  async function getToken() {
    const { data } = await supabaseBrowser().auth.getSession();
    return data?.session?.access_token;
  }

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.error ?? res.statusText);
      const all = (await res.json()) as Cat[];
      setRows(all);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load categories.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const parents = rows.filter(c => c.parent_id === null).sort((a,b)=>a.label.localeCompare(b.label));
  const childrenOf = (pid: string) => rows.filter(c => c.parent_id === pid).sort((a,b)=>a.label.localeCompare(b.label));

  async function addParent() {
    const token = await getToken(); if (!token) return alert('unauthenticated');
    const payload = { label: newParent.label.trim(), slug: newParent.slug.trim() || undefined, parent_id: null };
    if (!payload.label) return alert('Label required');

    const res = await fetch('/api/admin/categories', {
      method:'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return alert((await res.json().catch(()=>({})))?.error ?? res.statusText);
    setNewParent({ label:'', slug:'' });
    await load();
  }

  async function addChild(parent_id: string) {
    const token = await getToken(); if (!token) return alert('unauthenticated');
    const f = newChild[parent_id] ?? { label:'', slug:'' };
    const payload = { label: f.label.trim(), slug: f.slug.trim() || undefined, parent_id };
    if (!payload.label) return alert('Label required');

    const res = await fetch('/api/admin/categories', {
      method:'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return alert((await res.json().catch(()=>({})))?.error ?? res.statusText);

    setNewChild(prev => ({ ...prev, [parent_id]: { label:'', slug:'' } }));
    await load();
  }

  async function rename(id: string, label: string, slug: string) {
    const token = await getToken(); if (!token) return alert('unauthenticated');
    const res = await fetch(`/api/admin/categories/${id}`, {
      method:'PATCH',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ label: label.trim(), slug: slug.trim() || undefined })
    });
    if (!res.ok) return alert((await res.json().catch(()=>({})))?.error ?? res.statusText);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete category? It must have no children and no products assigned.')) return;
    const token = await getToken(); if (!token) return alert('unauthenticated');
    const res = await fetch(`/api/admin/categories/${id}`, {
      method:'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return alert((await res.json().catch(()=>({})))?.error ?? res.statusText);
    await load();
  }

  if (loading) return <div style={{ padding:20 }}>Loading categories…</div>;
  if (err) return <div style={{ padding:20, color:'#fca5a5' }}>Error: {err}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Categories</h1>

      {/* Add parent */}
      <div style={{ border:'1px solid #1f2937', borderRadius:10, padding:12, marginBottom:12 }}>
        <h2 style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>Add Parent Category</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8 }}>
          <input style={input} placeholder="Label (e.g., Sarees)"
            value={newParent.label} onChange={e=>setNewParent(p=>({ ...p, label: e.target.value }))}/>
          <input style={input} placeholder="Slug (optional, auto from label)"
            value={newParent.slug} onChange={e=>setNewParent(p=>({ ...p, slug: e.target.value }))}/>
          <button style={primaryBtn} onClick={addParent}>Add</button>
        </div>
      </div>

      {/* List parents + children */}
      <div style={{ display:'grid', gap:12 }}>
        {parents.map(par => (
          <div key={par.id} style={{ border:'1px solid #1f2937', borderRadius:10, padding:12 }}>
            <EditableRow cat={par} onSave={rename} onDelete={remove} />

            {/* Add child */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginTop:8 }}>
              <input style={input} placeholder="New subcategory label (e.g., Banarasi)"
                value={(newChild[par.id]?.label ?? '')}
                onChange={e=>setNewChild(prev => ({ ...prev, [par.id]: { ...(prev[par.id] ?? { label:'', slug:''}), label: e.target.value } }))}/>
              <input style={input} placeholder="Slug (optional)"
                value={(newChild[par.id]?.slug ?? '')}
                onChange={e=>setNewChild(prev => ({ ...prev, [par.id]: { ...(prev[par.id] ?? { label:'', slug:''}), slug: e.target.value } }))}/>
              <button style={secondaryBtn} onClick={()=>addChild(par.id)}>Add subcategory</button>
            </div>

            {/* Children */}
            <div style={{ marginTop:10, paddingLeft:12, borderLeft:'2px solid #1f2937' }}>
              {childrenOf(par.id).length === 0 ? (
                <div style={{ opacity:0.7 }}>No subcategories.</div>
              ) : (
                <div style={{ display:'grid', gap:8 }}>
                  {childrenOf(par.id).map(child => (
                    <EditableRow key={child.id} cat={child} onSave={rename} onDelete={remove} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableRow({ cat, onSave, onDelete }:{
  cat: Cat;
  onSave: (id:string, label:string, slug:string)=>void;
  onDelete: (id:string)=>void;
}) {
  const [label, setLabel] = useState(cat.label);
  const [slug, setSlug] = useState(cat.slug);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap:8 }}>
      <input style={input} value={label} onChange={e=>setLabel(e.target.value)} />
      <input style={input} value={slug} onChange={e=>setSlug(e.target.value)} />
      <button style={secondaryBtn} onClick={()=>onSave(cat.id, label, slug)}>Save</button>
      <button style={{ ...secondaryBtn, borderColor:'#7f1d1d', color:'#fecaca' }} onClick={()=>onDelete(cat.id)}>Delete</button>
    </div>
  );
}

const input: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0b1220', color:'#e2e8f0' };
const primaryBtn: React.CSSProperties = { background:'#2563eb', color:'#fff', padding:'10px 12px', borderRadius:8, border:'none', cursor:'pointer' };
const secondaryBtn: React.CSSProperties = { background:'#1f2937', color:'#e5e7eb', border:'1px solid #374151', borderRadius:8, padding:'10px 12px', cursor:'pointer' };
