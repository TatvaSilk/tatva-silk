// app/api/admin/users/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  // 1) Who is calling?
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // 2) Read caller's role from profiles
  const { data: me, error: meErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (meErr || !me) return NextResponse.json({ error: 'profile-not-found' }, { status: 404 });
  if (!['admin', 'manager'].includes(me.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 3) Fetch users with service role (bypass RLS)
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, role, approved, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
