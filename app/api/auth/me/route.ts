import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = supabaseServer();

  // Get session/user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Read role from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: 'profile-not-found' }, { status: 404 });
  }

  return NextResponse.json({
    userId: user.id,
    email: profile?.email ?? user.email,
    role: profile?.role ?? 'customer'
  });
}
