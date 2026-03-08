export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Authenticates using the Bearer token forwarded from the client.
 * Avoids cookie-sync issues and works reliably with the App Router.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );

  // 1) Identify user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Defaults if profile is missing
  let email = user.email ?? null;
  let role: 'admin' | 'manager' | 'customer' = 'customer';
  let approved = false;

  // 2) Try read existing profile
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('email, role, approved')
    .eq('id', user.id)
    .maybeSingle();

  if (!profileErr && profileData) {
    email = profileData.email ?? email;
    role = (profileData.role as any) ?? role;
    approved = (profileData.approved as any) ?? approved;
  } else {
    // 3) Create minimal profile row (best-effort) if it doesn't exist yet
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: user.id, email })
      .select('email, role, approved')
      .maybeSingle();

    if (!insertErr && inserted) {
      email = inserted.email ?? email;
      role = (inserted.role as any) ?? role;
      approved = (inserted.approved as any) ?? approved;
    }
  }

  // 4) Optional fallback: if you still have `admin_users`, honor that role by email
  if (role === 'customer') {
    const { data: adminRow, error: adminErr } = await supabase
      .from('admin_users')
      .select('role, email')
      .eq('email', email)
      .maybeSingle();

    if (!adminErr && adminRow && (adminRow.role === 'admin' || adminRow.role === 'manager')) {
      role = adminRow.role as any;
      approved = true;
    }
  }

  return NextResponse.json({
    userId: user.id,
    email,
    role,
    approved
  });
}
