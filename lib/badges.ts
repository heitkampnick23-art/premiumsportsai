import { exec, q } from './db';

// Each badge has a unique gradient + title + criteria evaluator.
export type Badge = {
  id: string;
  title: string;
  subtitle: string;
  gradient: [string, string];   // svg stops
  icon: string;                 // single character / emoji rendered in svg
};

export const BADGES: Record<string, Badge> = {
  'streak-7':     { id: 'streak-7',     title: '7-day club',      subtitle: 'Showed up a week',          gradient: ['#FB923C', '#EF4444'], icon: '7' },
  'streak-30':    { id: 'streak-30',    title: '30-day club',     subtitle: 'A month strong',            gradient: ['#FACC15', '#F97316'], icon: '30' },
  'streak-90':    { id: 'streak-90',    title: '90-day club',     subtitle: 'Quarter season locked',     gradient: ['#22D3EE', '#0EA5E9'], icon: '90' },
  'streak-365':   { id: 'streak-365',   title: '365-day club',    subtitle: 'A whole year of edge',      gradient: ['#A855F7', '#EC4899'], icon: '365' },
  // NEW phase-3 badges
  'first-lock-hit':   { id: 'first-lock-hit',   title: 'First Lock Hit',  subtitle: 'Your first take graded a hit', gradient: ['#10B981', '#84CC16'], icon: '✓' },
  '10x-referrer':     { id: '10x-referrer',     title: '10x Referrer',    subtitle: 'Brought ten friends',          gradient: ['#3B82F6', '#06B6D4'], icon: '10' },
  'contest-champ':    { id: 'contest-champ',    title: 'Contest Champ',   subtitle: 'Won the weekly contest',       gradient: ['#F59E0B', '#DC2626'], icon: '★' },
  'sharp-subscriber': { id: 'sharp-subscriber', title: 'Sharp Subscriber',subtitle: 'On the Sharp tier',            gradient: ['#1E3A8A', '#7C3AED'], icon: 'S' },
  'streak-king-100':  { id: 'streak-king-100',  title: 'Streak King 100', subtitle: '100-day login streak',         gradient: ['#DC2626', '#FACC15'], icon: '100' },
};

export function renderBadgeSvg(id: string, size = 256): string {
  const b = BADGES[id];
  if (!b) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256"><rect width="100%" height="100%" fill="#27272a"/></svg>`;
  }
  const [c1, c2] = b.gradient;
  // hash the id to a unique rotation per badge for visual uniqueness
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const rot = Math.abs(h) % 360;
  const ringRot = (Math.abs(h) >> 3) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg-${id}" gradientTransform="rotate(${rot})">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="ring-${id}" gradientTransform="rotate(${ringRot})">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <circle cx="128" cy="128" r="120" fill="url(#bg-${id})"/>
  <circle cx="128" cy="128" r="118" fill="none" stroke="url(#ring-${id})" stroke-width="4"/>
  <circle cx="128" cy="128" r="92" fill="rgba(0,0,0,0.18)"/>
  <text x="128" y="148" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="${b.icon.length > 2 ? '54' : '88'}" fill="#fff">${b.icon}</text>
  <text x="128" y="220" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="16" fill="#fff">${escapeXml(b.title.toUpperCase())}</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

export async function ensureUserStreakRow(email: string) {
  const row = (await q<any>('SELECT * FROM user_streaks WHERE user_email = ?', [email])).results[0];
  if (!row) {
    await exec(
      'INSERT INTO user_streaks (user_email, current_streak, best_streak, last_login_day, badges, reward_granted_30) VALUES (?, ?, ?, ?, ?, ?)',
      [email, 0, 0, null, '[]', 0],
    );
  }
}

export async function awardBadge(email: string, badgeId: string): Promise<boolean> {
  if (!BADGES[badgeId]) return false;
  await ensureUserStreakRow(email);
  const row = (await q<any>('SELECT * FROM user_streaks WHERE user_email = ?', [email])).results[0];
  const owned: string[] = JSON.parse(row?.badges || '[]');
  if (owned.includes(badgeId)) return false;
  owned.push(badgeId);
  await exec('UPDATE user_streaks SET badges = ? WHERE user_email = ?', [JSON.stringify(owned), email]);
  return true;
}

export async function getUserBadges(email: string): Promise<string[]> {
  const row = (await q<any>('SELECT badges FROM user_streaks WHERE user_email = ?', [email])).results[0];
  return JSON.parse(row?.badges || '[]');
}

// Run after relevant events: lock hit, referral granted, contest win, sub change.
export async function evaluateBadges(email: string) {
  if (!email) return;
  try {
    // First Lock Hit
    const hit = (await q<any>(`
      SELECT take_grades.* FROM take_grades
      JOIN takes ON takes.id = take_grades.take_id
      WHERE takes.user_email = ? AND take_grades.hit = 1 LIMIT 1`, [email])).results[0];
    if (hit) await awardBadge(email, 'first-lock-hit');
  } catch { /* table optional */ }
  try {
    // 10x referrer
    const refs = (await q<any>('SELECT COUNT(*) as n FROM referrals WHERE referrer_email = ? AND status = ?', [email, 'granted'])).results[0];
    if (Number(refs?.n ?? 0) >= 10) await awardBadge(email, '10x-referrer');
  } catch {}
  try {
    // Contest champ
    const wins = (await q<any>('SELECT COUNT(*) as n FROM contests WHERE winner_email = ?', [email])).results[0];
    if (Number(wins?.n ?? 0) >= 1) await awardBadge(email, 'contest-champ');
  } catch {}
  try {
    // Sharp subscriber
    const sub = (await q<any>('SELECT * FROM subscriptions WHERE user_email = ? AND active = 1 AND tier = ?', [email, 'sharp'])).results[0];
    if (sub) await awardBadge(email, 'sharp-subscriber');
  } catch {}
  try {
    // Streak king 100
    const row = (await q<any>('SELECT current_streak, best_streak FROM user_streaks WHERE user_email = ?', [email])).results[0];
    if (Math.max(Number(row?.current_streak ?? 0), Number(row?.best_streak ?? 0)) >= 100) {
      await awardBadge(email, 'streak-king-100');
    }
  } catch {}
}
