export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

/**
 * GET /api/store/categories
 * Response: [
 *   {
 *     id, label, slug, parent_id: null,
 *     children: [
 *       { id, label, slug, parent_id: <parent-id> },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 *
 * Notes:
 * - We return ALL parents (parent_id IS NULL) with their children.
 * - Your UI can decide which parents to render (e.g., show just Sarees' children
 *   in the top navbar, or show all).
 */
export async function GET() {
  try {
    const admin = supabaseAdmin();

    // Fetch all categories (parents + children)
    const { data, error } = await admin
      .from('categories')
      .select('id, label, slug, parent_id')
      .order('label', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const parents = rows.filter(c => c.parent_id === null);
    const children = rows.filter(c => c.parent_id !== null);

    // Build nested shape: parents with children
    const grouped = parents.map(p => ({
      ...p,
      children: children.filter(c => c.parent_id === p.id),
    }));

    return NextResponse.json(grouped);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
