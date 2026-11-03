import { SignJWT, jwtVerify } from 'jose';

const COOKIE = 'nmb_session';
const encoder = new TextEncoder();

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return encoder.encode(s);
}

export const SESSION_COOKIE = COOKIE;

export async function createSession(email) {
  return await new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}

// Constant-time-ish comparison to avoid trivial timing leaks.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function checkCredentials(email, password) {
  const e = process.env.ADMIN_EMAIL || '';
  const p = process.env.ADMIN_PASSWORD || '';
  if (!e || !p) return false;
  const emailOk = safeEqual(String(email).trim().toLowerCase(), e.trim().toLowerCase());
  const passOk = safeEqual(String(password), p);
  return emailOk && passOk;
}
