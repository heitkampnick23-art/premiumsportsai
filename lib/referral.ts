import { exec, q } from './db';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randCode(len = 7): string {
  let s = '';
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) s += ALPHABET[buf[i] % ALPHABET.length];
  return s;
}

export async function getOrCreateReferralCode(email: string): Promise<string> {
  const u = (await q<any>('SELECT referral_code FROM users WHERE email = ?', [email])).results[0];
  if (u?.referral_code) return u.referral_code;
  for (let i = 0; i < 6; i++) {
    const code = randCode();
    const dup = (await q<any>('SELECT email FROM users WHERE referral_code = ?', [code])).results[0];
    if (!dup) {
      await exec('UPDATE users SET referral_code = ? WHERE email = ?', [code, email]);
      return code;
    }
  }
  // give up uniqueness — append timestamp suffix
  const code = randCode() + Date.now().toString(36).slice(-2).toUpperCase();
  await exec('UPDATE users SET referral_code = ? WHERE email = ?', [code, email]);
  return code;
}

export async function referrerEmailForCode(code: string): Promise<string | null> {
  const u = (await q<any>('SELECT email FROM users WHERE referral_code = ?', [code.toUpperCase()])).results[0];
  return u?.email ?? null;
}

export async function attachReferral(referee: string, referrer: string): Promise<void> {
  if (!referee || !referrer || referee === referrer) return;
  // Don't overwrite an existing pending/granted referral for this referee
  const existing = (await q<any>('SELECT * FROM referrals WHERE referee_email = ?', [referee])).results[0];
  if (existing) return;
  await exec('UPDATE users SET referred_by = ? WHERE email = ? AND referred_by IS NULL', [referrer, referee]);
  await exec(
    'INSERT INTO referrals (id, referrer_email, referee_email, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [crypto.randomUUID(), referrer, referee, 'pending', Date.now()],
  );
}

export async function referralStats(email: string) {
  const all = (await q<any>('SELECT * FROM referrals WHERE referrer_email = ?', [email])).results;
  return {
    total: all.length,
    granted: all.filter(r => r.status === 'granted').length,
    pending: all.filter(r => r.status === 'pending').length,
  };
}
