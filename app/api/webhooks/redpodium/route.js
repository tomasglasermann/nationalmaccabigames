import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  }
  return null;
}

function toAmount(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// RedPodium posts here when a donation/registration event fires.
// The exact payload shape is confirmed once the first real event arrives;
// we store the full raw payload so nothing is lost, plus best-effort fields.
export async function POST(req) {
  const secret = process.env.REDPODIUM_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.headers.get('x-webhook-secret') ||
      new URL(req.url).searchParams.get('secret') ||
      '';
    if (provided !== secret) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  let payload = null;
  try {
    payload = await req.json();
  } catch {
    try {
      const text = await req.text();
      payload = { _raw: text };
    } catch {
      payload = null;
    }
  }

  const sb = getSupabase();
  if (sb && payload) {
    const first = pick(payload, ['first_name', 'firstName', 'fname']);
    const last = pick(payload, ['last_name', 'lastName', 'lname']);
    const name =
      pick(payload, ['name', 'donor_name', 'full_name', 'fullName']) ||
      [first, last].filter(Boolean).join(' ') ||
      null;
    await sb.from('donations').insert({
      donor_name: name,
      donor_email: pick(payload, ['email', 'donor_email', 'emailAddress']),
      amount: toAmount(pick(payload, ['amount', 'total', 'donation_amount', 'amount_paid', 'grand_total'])),
      currency: pick(payload, ['currency']) || 'USD',
      source: 'redpodium',
      raw: payload,
    });
  }

  // Always 200 so RedPodium does not keep retrying.
  return Response.json({ ok: true });
}
