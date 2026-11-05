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

// Editable text fields (besides status/notes), with length caps.
const EDITABLE = {
  participant_first_name: 120,
  participant_last_name: 120,
  participant_phone: 40,
  participant_dob: 40,
  parent1_first_name: 120,
  parent1_last_name: 120,
  parent1_email: 160,
  parent1_phone: 40,
  sport: 80,
};

// Update a registration's status, notes, or any editable field.
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
  for (const [key, max] of Object.entries(EDITABLE)) {
    if (typeof body[key] === 'string') patch[key] = body[key].trim().slice(0, max);
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 });
  }
  const sb = getSupabase();
  const { data, error } = await sb.from('registrations').update(patch).eq('id', id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, row: data });
}

// Delete a registration.
export async function DELETE(req) {
  if (!supabaseConfigured()) return Response.json({ error: 'not configured' }, { status: 503 });
  let id = '';
  try {
    const body = await req.json();
    id = body && body.id;
  } catch {
    id = '';
  }
  if (!id) {
    const u = new URL(req.url);
    id = u.searchParams.get('id') || '';
  }
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
  const sb = getSupabase();
  const { error } = await sb.from('registrations').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
