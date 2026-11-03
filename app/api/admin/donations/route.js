import { getSupabase, supabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseConfigured()) return Response.json({ configured: false, rows: [], total: 0 });
  const sb = getSupabase();
  const { data, error } = await sb
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) return Response.json({ configured: true, error: error.message, rows: [], total: 0 }, { status: 500 });
  const rows = data || [];
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return Response.json({ configured: true, rows, total });
}
