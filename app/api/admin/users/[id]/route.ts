// app/api/admin/users/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServer';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

type Body = Partial<{
  role: 'admin' | 'manager' | 'customer';
  approved: boolean;
}>;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const targetId = params.id;
  const body = (await req.json()) as Body;

  // 1) Authenticate caller
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // 2) Caller must be admin
  const { data: me, error: meErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (meErr || !me) return NextResponse.json({ error: 'profile-not-found' }, { status: 404 });
  if (me.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Optional: avoid locking yourself out by demoting your own account
  if (user.id === targetId && body.role && body.role !== 'admin') {
    return NextResponse.json({ error: 'cannot-demote-self' }, { status: 400 });
  }

  // 3) Validate payload (minimal)
  const patch: Record<string, any> = {};
  if (typeof body.approved === 'boolean') patch.approved = body.approved;
  if (body.role && ['admin', 'manager', 'customer'].includes(body.role)) patch.role = body.role;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'no-valid-fields' }, { status: 400 });
  }

  // 4) Update with service role (bypass RLS)
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
