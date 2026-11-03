import { getSupabase, supabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseConfigured()) {
    return Response.json({ configured: false, registrations: 0, donations: 0, donationTotal: 0, uniforms: 0 });
  }
  const sb = getSupabase();
  const [reg, don, uni] = await Promise.all([
    sb.from('registrations').select('id', { count: 'exact', head: true }),
    sb.from('donations').select('amount'),
    sb.from('uniforms').select('id', { count: 'exact', head: true }),
  ]);
  const donationTotal = (don.data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return Response.json({
    configured: true,
    registrations: reg.count || 0,
    donations: (don.data || []).length,
    donationTotal,
    uniforms: uni.count || 0,
  });
}
