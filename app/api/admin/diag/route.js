import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Protected by middleware (/api/admin/*). Open this URL in the browser while
// logged into /admin. Always returns JSON (never a 500 page) so the real error
// is visible.
export async function GET() {
  const out = { step: 'start' };
  try {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    out.urlPresent = !!url;
    out.urlLooksValid = /^https:\/\/.+\.supabase\.co\/?$/.test(url);
    out.urlValue = url ? url.replace(/\/+$/, '') : null;
    out.keyPresent = !!key;
    out.keyPrefix = key ? key.slice(0, 12) : null;
    out.keyLength = key.length;
    out.keyType = key.startsWith('sb_secret_')
      ? 'NEW secret key (correct)'
      : key.startsWith('sb_publishable_')
        ? 'NEW publishable key (WRONG — public key)'
        : key.startsWith('eyJ')
          ? 'legacy JWT'
          : 'unknown / empty';

    if (!url || !key) {
      out.verdict = 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in this environment.';
      return Response.json(out, { status: 200 });
    }

    out.step = 'createClient';
    let sb;
    try {
      sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    } catch (e) {
      out.createClientError = String((e && e.message) || e);
      out.verdict = 'createClient threw — URL is probably malformed.';
      return Response.json(out, { status: 200 });
    }

    out.step = 'readTest';
    try {
      const r = await sb.from('registrations').select('id', { count: 'exact', head: true });
      out.readTest = r.error ? { ok: false, error: r.error.message, code: r.error.code } : { ok: true, count: r.count };
    } catch (e) {
      out.readTest = { ok: false, thrown: String((e && e.message) || e) };
    }

    out.step = 'writeTest';
    try {
      const ins = await sb.from('registrations').insert({
        participant_first_name: '__diag__', participant_last_name: '__test__',
        parent1_email: 'diag@test.local', sport: '__diag__', status: 'new',
      }).select('id');
      if (ins.error) {
        out.writeTest = { ok: false, error: ins.error.message, code: ins.error.code };
      } else {
        out.writeTest = { ok: true };
        const id = ins.data && ins.data[0] && ins.data[0].id;
        if (id) await sb.from('registrations').delete().eq('id', id);
      }
    } catch (e) {
      out.writeTest = { ok: false, thrown: String((e && e.message) || e) };
    }

    out.verdict = (out.readTest && out.readTest.ok && out.writeTest && out.writeTest.ok)
      ? 'ALL GOOD — reads and writes work. The form should save now.'
      : 'Problem found — see readTest / writeTest above.';
    return Response.json(out, { status: 200 });
  } catch (e) {
    out.fatal = String((e && e.stack) || (e && e.message) || e);
    return Response.json(out, { status: 200 });
  }
}
