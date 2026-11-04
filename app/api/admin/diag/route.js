import { getSupabase, supabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Protected by middleware (/api/admin/*). Open this URL in the browser while
// logged into /admin to see the exact Supabase connection status.
export async function GET() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const out = {
    urlPresent: !!url,
    urlLooksValid: /^https:\/\/.+\.supabase\.co/.test(url),
    keyPresent: !!key,
    keyPrefix: key ? key.slice(0, 12) : null,
    keyType: key.startsWith('sb_secret_')
      ? 'NEW secret key (correct)'
      : key.startsWith('sb_publishable_')
        ? 'NEW publishable key (WRONG — this is the public key)'
        : key.startsWith('eyJ')
          ? 'legacy JWT (anon or service_role)'
          : 'unknown / empty',
    configured: supabaseConfigured(),
    readTest: null,
    writeTest: null,
  };

  const sb = getSupabase();
  if (!sb) {
    out.result = 'Supabase client could not be created (missing URL or key).';
    return Response.json(out);
  }

  // READ test
  try {
    const r = await sb.from('registrations').select('id', { count: 'exact', head: true });
    out.readTest = r.error ? { ok: false, error: r.error.message } : { ok: true, count: r.count };
  } catch (e) {
    out.readTest = { ok: false, error: String(e && e.message || e) };
  }

  // WRITE test (insert a temp row, then delete it)
  try {
    const ins = await sb.from('registrations').insert({
      participant_first_name: '__diag__',
      participant_last_name: '__test__',
      parent1_email: 'diag@test.local',
      sport: '__diag__',
      status: 'new',
    }).select('id');
    if (ins.error) {
      out.writeTest = { ok: false, error: ins.error.message };
    } else {
      out.writeTest = { ok: true };
      const id = ins.data && ins.data[0] && ins.data[0].id;
      if (id) await sb.from('registrations').delete().eq('id', id);
    }
  } catch (e) {
    out.writeTest = { ok: false, error: String(e && e.message || e) };
  }

  out.verdict = (out.readTest?.ok && out.writeTest?.ok)
    ? 'ALL GOOD — database reads and writes work. The form should save now.'
    : 'Problem found — see readTest / writeTest error above.';

  return Response.json(out);
}
