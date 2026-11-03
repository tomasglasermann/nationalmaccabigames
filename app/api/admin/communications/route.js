import { getSupabase, supabaseConfigured } from '@/lib/supabase';
import { getResend, resendConfigured, mailFrom } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const base = { configured: supabaseConfigured(), resendReady: resendConfigured(), rows: [] };
  if (!supabaseConfigured()) return Response.json(base);
  const sb = getSupabase();
  const { data, error } = await sb
    .from('communications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return Response.json({ ...base, error: error.message }, { status: 500 });
  return Response.json({ ...base, rows: data || [] });
}

export async function POST(req) {
  if (!resendConfigured()) {
    return Response.json(
      { error: 'Email is not connected yet. Add RESEND_API_KEY and MAIL_FROM in Vercel and verify your domain in Resend.' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const subject = (body.subject || '').trim().slice(0, 200);
  const message = (body.body || '').trim();
  if (!subject || !message) {
    return Response.json({ error: 'Subject and message are required' }, { status: 400 });
  }

  const test = !!body.test;
  const audience = body.audience === 'sport' ? 'sport' : 'all';
  const sport = (body.sport || '').trim();

  let recipients = [];
  if (test) {
    if (process.env.ADMIN_EMAIL) recipients = [process.env.ADMIN_EMAIL.trim().toLowerCase()];
  } else {
    if (!supabaseConfigured()) {
      return Response.json({ error: 'Database not connected — needed to load recipients.' }, { status: 503 });
    }
    const sb = getSupabase();
    let q = sb.from('registrations').select('parent1_email');
    if (audience === 'sport' && sport) q = q.eq('sport', sport);
    const { data, error } = await q;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const set = new Set();
    (data || []).forEach((r) => {
      const e = (r.parent1_email || '').trim().toLowerCase();
      if (EMAIL_RE.test(e)) set.add(e);
    });
    recipients = [...set];
  }

  if (recipients.length === 0) {
    return Response.json({ error: 'No valid recipients found for that audience.' }, { status: 400 });
  }

  const resend = getResend();
  const from = mailFrom();
  const html = message.includes('<') ? message : `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0A2342">${message.replace(/\n/g, '<br>')}</div>`;

  let sent = 0;
  let failed = 0;
  let lastId = null;

  for (let i = 0; i < recipients.length; i += 100) {
    const chunk = recipients.slice(i, i + 100).map((to) => ({ from, to, subject, html }));
    try {
      const res = await resend.batch.send(chunk);
      if (res && res.error) {
        failed += chunk.length;
      } else {
        sent += chunk.length;
        const arr = res?.data?.data;
        if (Array.isArray(arr) && arr[0]?.id) lastId = arr[0].id;
      }
    } catch {
      failed += chunk.length;
    }
  }

  if (supabaseConfigured() && !test) {
    const sb = getSupabase();
    await sb.from('communications').insert({
      subject,
      body: message,
      recipients,
      sent_count: sent,
      status: failed ? 'partial' : 'sent',
      resend_id: lastId,
    });
  }

  return Response.json({ ok: failed === 0, sent, failed, test });
}
