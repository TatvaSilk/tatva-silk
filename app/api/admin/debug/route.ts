export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const admin = supabaseAdmin();
    // 1) Identify which Supabase project (host) this server is using
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // 2) Read your profile via service role (bypasses RLS)
    const { data, error } = await admin
      .from('profiles')
      .select('id, email, role, approved, created_at')
      .ilike('email', 'nimeshpatel001@yahoo.com') // <- change if needed
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok:false, projectUrl, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok:true, projectUrl, profile: data });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'unknown' }, { status: 500 });
  }
}
``
