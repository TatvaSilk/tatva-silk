'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../../lib/supabaseClient';

type UserRow = {
  id: string;
  email: string | null;
  role: 'admin' | 'manager' | 'customer';
  approved: boolean;
  created_at: string | null;
};

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function getToken() {
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  }

  async function loadUsers() {
    setLoading(true);
    setErr(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('unauthenticated');
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) {
        const msg = await safeMsg(res);
        throw new Error(msg);
      }
      const data = (await res.json()) as UserRow[];
      setRows(data);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load users.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(id: string, patch: Partial<Pick<UserRow, 'role' | 'approved'>>) {
    setSavingId(id);
    try {
      const token = await getToken();
      if (!token) throw new Error('unauthenticated');
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(patch)
      });
      if (!res.ok) {
        const msg = await safeMsg(res);
        throw new Error(msg);
      }
      const updated = (await res.json()) as UserRow;
      setRows(prev => (prev ?? []).map(u => (u.id === id ? { ...u, ...updated } : u)));
    } catch (e: any) {
      alert(`Update failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading users…</div>;
  if (err) return (
    <div style={{ padding: 20 }}>
      <div style={{ color: '#fca5a5', marginBottom: 8 }}>Error: {err}</div>
      <button onClick={loadUsers} style={secondaryBtn}>Retry</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Users</h1>
        <button onClick={loadUsers} style={secondaryBtn}>Refresh</button>
      </div>

      {!rows?.length ? (
        <div style={{ padding: 20, opacity: 0.7 }}>No users found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#111827' }}>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Approved</th>
                <th style={th}>Created</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={td}>{u.email ?? '—'}</td>
                  <td style={td}>
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as UserRow['role'] })}
                      style={select}
                      disabled={savingId === u.id}
                    >
                      <option value="customer">customer</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={td}>
                    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={u.approved}
                        onChange={(e) => updateUser(u.id, { approved: e.target.checked })}
                        disabled={savingId === u.id}
                      />
                      {u.approved ? 'Approved' : 'Pending'}
                    </label>
                  </td>
                  <td style={td}>{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', opacity: 0.6 }}>#{u.id.slice(0, 8)}</td>
                </tr>
              ))}
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
const secondaryBtn: React.CSSProperties = {
  background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 6, padding: '8px 10px', cursor: 'pointer'
};
const select: React.CSSProperties = {
  background: '#0b1220', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px'
};
