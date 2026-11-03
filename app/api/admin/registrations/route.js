import { getSupabase, supabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseConfigured()) return Response.json({ configured: false, rows: [] });
  const sb = getSupabase();
  const { data, error } = await sb
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) return Response.json({ configured: true, error: error.message, rows: [] }, { status: 500 });
  return Response.json({ configured: true, rows: data || [] });
}

// Update a registration's status or notes.
export async function PATCH(req) {
  if (!supabaseConfigured()) return Response.json({ error: 'not configured' }, { status: 503 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { id, status, notes } = body || {};
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
  const patch = {};
  if (typeof status === 'string') patch.status = status.slice(0, 40);
  if (typeof notes === 'string') patch.notes = notes.slice(0, 2000);
  const sb = getSupabase();
  const { error } = await sb.from('registrations').update(patch).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
