import { Resend } from 'resend';

let cached = null;

export function resendConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export function mailFrom() {
  return process.env.MAIL_FROM || 'NMB Maccabi <onboarding@resend.dev>';
}

export function getResend() {
  if (cached) return cached;
  if (!process.env.RESEND_API_KEY) return null;
  cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}
