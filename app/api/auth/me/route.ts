import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function GET() {
  const supabase = supabaseServer();

  // 1) Get the signed-in user from the session cookie
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // 2) Try to read profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, approved')
    .eq('id', user.id)
    .maybeSingle();

  // 3) If missing, auto-create a minimal row (allowed by our RLS insert policy)
  if (!profile) {
    const { data: inserted } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email ?? null })
      .select('id, email, role, approved')
      .single();

    profile = inserted ?? null;
  }

  // 4) As a fallback (if you still use admin_users), honor that role by email
  let role: 'admin' | 'manager' | 'customer' = (profile?.role as any) ?? 'customer';
  let approved = (profile?.approved as any) ?? false;
  let email = profile?.email ?? user.email ?? '';

  if (!profile) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('email', email)
      .maybeSingle();

    if (admin?.role === 'admin' || admin?.role === 'manager') {
      role = admin.role as any;
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
