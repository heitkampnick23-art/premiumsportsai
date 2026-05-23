import { exec, q } from './db';

export type Profile = {
  email: string;
  handle: string;
  takes: { hits: number; total: number; clout: number };
  streak: { current: number; best: number; badges: string[] };
  referrals: number;
  fav_teams: string[];
};

export async function handleForEmail(email: string): Promise<string> {
  if (!email) return 'anon';
  const u = (await q<any>('SELECT handle FROM users WHERE email = ?', [email])).results[0];
  if (u?.handle) return u.handle;
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || 'fan';
  for (let i = 0; i < 6; i++) {
    const suffix = i === 0 ? '' : String(Math.floor(Math.random() * 9000) + 100);
    const cand = (base + suffix).slice(0, 24);
    const dup = (await q<any>('SELECT email FROM users WHERE handle = ?', [cand])).results[0];
    if (!dup) {
      await exec('UPDATE users SET handle = ? WHERE email = ?', [cand, email]);
      return cand;
    }
  }
  const cand = base.slice(0, 18) + Date.now().toString(36).slice(-4);
  await exec('UPDATE users SET handle = ? WHERE email = ?', [cand, email]);
  return cand;
}

export async function emailForHandle(handle: string): Promise<string | null> {
  const u = (await q<any>('SELECT email FROM users WHERE handle = ?', [handle.toLowerCase()])).results[0];
  return u?.email ?? null;
}

export async function setHandle(email: string, handle: string): Promise<{ ok: boolean; error?: string }> {
  const h = handle.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
  if (h.length < 3) return { ok: false, error: 'Handle must be 3+ chars (a-z, 0-9, _)' };
  const dup = (await q<any>('SELECT email FROM users WHERE handle = ?', [h])).results[0];
  if (dup && dup.email !== email) return { ok: false, error: 'Handle taken' };
  await exec('UPDATE users SET handle = ? WHERE email = ?', [h, email]);
  return { ok: true };
}

export async function profileForEmail(email: string): Promise<Profile> {
  const handle = await handleForEmail(email);
  const takes = (await q<any>('SELECT * FROM takes WHERE user_email = ?', [email])).results;
  const totalClout = takes.reduce((a: number, t: any) => a + (t.clout ?? 0), 0);
  const graded = (await q<any>('SELECT * FROM take_grades', [])).results;
  const myGradedIds = new Set(takes.map((t: any) => t.id));
  const hitGrades = graded.filter((g: any) => myGradedIds.has(g.take_id));
  const hits = hitGrades.filter((g: any) => g.hit === 1).length;
  const streakRow = (await q<any>('SELECT * FROM user_streaks WHERE user_email = ?', [email])).results[0];
  const refs = (await q<any>('SELECT * FROM referrals WHERE referrer_email = ? AND status = ?', [email, 'granted'])).results;
  const agent = (await q<any>('SELECT teams FROM agent_settings WHERE user_email = ?', [email])).results[0];
  const fav = agent?.teams ? String(agent.teams).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  return {
    email,
    handle,
    takes: { hits, total: hitGrades.length, clout: totalClout },
    streak: {
      current: streakRow?.current_streak ?? 0,
      best: streakRow?.best_streak ?? 0,
      badges: JSON.parse(streakRow?.badges || '[]'),
    },
    referrals: refs.length,
    fav_teams: fav,
  };
}
