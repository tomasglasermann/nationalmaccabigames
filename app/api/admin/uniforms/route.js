import { getSupabase, supabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseConfigured()) return Response.json({ configured: false, rows: [] });
  const sb = getSupabase();
  const { data, error } = await sb
    .from('uniforms')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) return Response.json({ configured: true, error: error.message, rows: [] }, { status: 500 });
  return Response.json({ configured: true, rows: data || [] });
}

export async function POST(req) {
  if (!supabaseConfigured()) return Response.json({ error: 'not configured' }, { status: 503 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const s = (v, n = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
  const row = {
    athlete_name: s(body.athlete_name),
    sport: s(body.sport),
    item: s(body.item),
    size: s(body.size, 20),
    status: s(body.status, 20) || 'needed',
    notes: s(body.notes, 500),
  };
  if (!row.athlete_name) return Response.json({ error: 'Athlete name is required' }, { status: 400 });
  const sb = getSupabase();
  const { error } = await sb.from('uniforms').insert(row);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function PATCH(req) {
  if (!supabaseConfigured()) return Response.json({ error: 'not configured' }, { status: 503 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { id, status } = body || {};
  if (!id || typeof status !== 'string') return Response.json({ error: 'Missing id or status' }, { status: 400 });
  const sb = getSupabase();
  const { error } = await sb.from('uniforms').update({ status: status.slice(0, 20) }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
