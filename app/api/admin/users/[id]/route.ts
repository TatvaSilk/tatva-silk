// app/api/admin/users/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

function clientFromToken(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

type Body = Partial<{ role: 'admin' | 'manager' | 'customer'; approved: boolean }>;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const targetId = params.id;
  const body = (await req.json()) as Body;

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;

  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: me, error: meErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (meErr || !me) return NextResponse.json({ error: 'profile-not-found' }, { status: 404 });

  const isAdmin = me.role === 'admin';
  const isManager = me.role === 'manager';

  // Managers can only toggle 'approved'; Admins can also change 'role'
  const patch: Record<string, any> = {};
  if (typeof body.approved === 'boolean') patch.approved = body.approved;
  if (isAdmin && body.role && ['admin','manager','customer'].includes(body.role)) patch.role = body.role;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: isAdmin ? 'no-valid-fields' : 'managers-can-only-approve' }, { status: 400 });
  }

  // Prevent demoting yourself from admin
  if (user.id === targetId && patch.role && patch.role !== 'admin') {
    return NextResponse.json({ error: 'cannot-demote-self' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', targetId)
    .select('id, email, role, approved')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
