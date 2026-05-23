import { env } from './env';

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const key = env().RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: 'PremiumSportsAi <agent@premiumsportsai.com>',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  return { ok: r.ok };
}
