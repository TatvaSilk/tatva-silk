'use client';

import useSWR from 'swr';

type UserRow = {
  id: string;
  email: string | null;
  role: 'admin' | 'manager' | 'customer';
  approved: boolean;
  created_at: string | null;
};

const fetcher = (u: string) => fetch(u).then(r => {
  if (!r.ok) throw new Error('Failed to load');
  return r.json();
});

export default function UsersPage() {
  const { data, isLoading, mutate, error } = useSWR<UserRow[]>('/api/admin/users', fetcher);

  async function updateUser(id: string, patch: Partial<Pick<UserRow, 'role' | 'approved'>>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (res.ok) {
      const updated = await res.json();
      mutate(prev => prev?.map(u => (u.id === id ? { ...u, ...updated } : u)), { revalidate: false });
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Update failed: ${err?.error ?? res.statusText}`);
    }
  }

  if (isLoading) return <div style={{ padding: 20 }}>Loading users…</div>;
  if (error) return <div style={{ padding: 20 }}>Failed to load users.</div>;

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Users</h1>
      {!data?.length ? (
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
              {data.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={td}>{u.email ?? '—'}</td>
                  <td style={td}>
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as UserRow['role'] })}
                      style={select}
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

const th: React.CSSProperties = { padding: '10px 8px', fontWeight: 600, fontSize: 12, color: '#cbd5e1' };
const td: React.CSSProperties = { padding: '10px 8px' };
const select: React.CSSProperties = {
  background: '#0b1220',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: 6,
  padding: '6px 8px'
};
