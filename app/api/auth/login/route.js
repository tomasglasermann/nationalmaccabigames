import { cookies } from 'next/headers';
import { checkCredentials, createSession, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!process.env.AUTH_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: 'Admin login is not configured yet. Set ADMIN_EMAIL, ADMIN_PASSWORD and AUTH_SECRET.' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = body?.email || '';
  const password = body?.password || '';

  if (!checkCredentials(email, password)) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = await createSession(String(email).trim().toLowerCase());
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return Response.json({ ok: true });
}
