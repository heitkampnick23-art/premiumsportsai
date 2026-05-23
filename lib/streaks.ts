import { exec, q } from './db';

function dayKey(d = new Date()): string { return d.toISOString().slice(0, 10); }
function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / 86400000);
}

export async function recordDailyLogin(email: string) {
  if (!email) return;
  const today = dayKey();
  const row = (await q<any>('SELECT * FROM user_streaks WHERE user_email = ?', [email])).results[0];
  if (!row) {
    await exec(
      'INSERT INTO user_streaks (user_email, current_streak, best_streak, last_login_day, badges, reward_granted_30) VALUES (?, ?, ?, ?, ?, ?)',
      [email, 1, 1, today, '[]', 0],
    );
    return;
  }
  if (row.last_login_day === today) return;
  const gap = row.last_login_day ? diffDays(row.last_login_day, today) : 999;
  let cur: number;
  if (gap === 1) cur = (row.current_streak ?? 0) + 1;
  else cur = 1;
  const best = Math.max(row.best_streak ?? 0, cur);
  const badges: string[] = JSON.parse(row.badges || '[]');
  for (const m of [7, 30, 90, 365]) {
    if (cur >= m && !badges.includes(`streak-${m}`)) badges.push(`streak-${m}`);
  }
  // 30-day reward — grant 1 free month of Pro, once
  let reward = row.reward_granted_30 ?? 0;
  if (cur >= 30 && !reward) {
    const grant = 1000 * 60 * 60 * 24 * 31;
    const subs = (await q<any>('SELECT * FROM subscriptions WHERE user_email = ?', [email])).results[0];
    const base = Math.max(Number(subs?.current_period_end ?? 0), Date.now());
    if (subs) {
      await exec(
        'UPDATE subscriptions SET active = ?, tier = COALESCE(tier, ?), current_period_end = ? WHERE user_email = ?',
        [1, 'pro', base + grant, email],
      );
    } else {
      await exec(
        'INSERT INTO subscriptions (id, user_email, stripe_id, active, tier, current_period_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), email, null, 1, 'pro', Date.now() + grant, Date.now()],
      );
    }
    reward = 1;
  }
  await exec(
    'UPDATE user_streaks SET current_streak = ?, best_streak = ?, last_login_day = ?, badges = ?, reward_granted_30 = ? WHERE user_email = ?',
    [cur, best, today, JSON.stringify(badges), reward, email],
  );
}

export async function getStreak(email: string) {
  const row = (await q<any>('SELECT * FROM user_streaks WHERE user_email = ?', [email])).results[0];
  return row ? {
    current: row.current_streak ?? 0,
    best: row.best_streak ?? 0,
    badges: JSON.parse(row.badges || '[]') as string[],
  } : { current: 0, best: 0, badges: [] as string[] };
}
