export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function clientFromToken(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : undefined;

  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: me, error: meErr } = await supabase
    .from('profiles')
    .select('role, approved')
    .eq('id', user.id)
    .single();

  if (meErr || !me) return NextResponse.json({ error: 'profile-not-found' }, { status: 404 });
  if (!['admin', 'manager'].includes(me.role as any)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const urlObj = new URL(req.url);
  const meOnly = urlObj.searchParams.get('me') === '1';
  const debug = urlObj.searchParams.get('debug') === '1';

  const admin = supabaseAdmin();
  let query = admin
    .from('profiles')
    .select('id, email, role, approved, created_at')
    .order('created_at', { ascending: false });

  if (meOnly) query = query.eq('id', user.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (debug) {
    return NextResponse.json({
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      rows: data ?? []
    });
  }

  return NextResponse.json(data ?? []);
}
