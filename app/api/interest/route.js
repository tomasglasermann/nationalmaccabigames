import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function str(v) {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, 300) : null;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const rec = {
    participant_first_name: str(body.participant_first_name),
    participant_last_name: str(body.participant_last_name),
    participant_phone: str(body.participant_phone),
    participant_dob: str(body.participant_dob),
    parent1_first_name: str(body.parent1_first_name),
    parent1_last_name: str(body.parent1_last_name),
    parent1_email: str(body.parent1_email),
    parent1_phone: str(body.parent1_phone),
    sport: str(body.sport),
  };

  if (!rec.participant_first_name || !rec.participant_last_name || !rec.parent1_email || !rec.sport) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const sb = getSupabase();
  if (!sb) {
    // Database not connected yet. Accept the submission so the public form is
    // never broken, but report that it was not stored.
    return Response.json({ ok: true, stored: false });
  }

  const { error } = await sb.from('registrations').insert({ ...rec, status: 'new' });
  if (error) {
    return Response.json({ error: 'Could not save registration' }, { status: 500 });
  }
  return Response.json({ ok: true, stored: true });
}
