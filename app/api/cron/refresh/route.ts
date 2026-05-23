import { NextResponse } from 'next/server';
import { listGames } from '@/lib/sports';
import { env } from '@/lib/env';
import { generateTodaysLocks } from '@/lib/locks';
import { q, exec } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getOrCreateThisWeekContest } from '@/lib/contest';
import { sendPush } from '@/lib/push';
import { drainEmailQueue, enqueueReactivationCandidates } from '@/lib/drip';

export const runtime = 'edge';

export async function POST(req: Request) {
  return run(req);
}
export async function GET(req: Request) {
  return run(req);
}

async function run(req: Request) {
  const url = new URL(req.url);
  const expected = env().CRON_SECRET ?? env().SESSION_SECRET;
  if (expected && url.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const games = await listGames();
  const out: any = { ok: true, games: games.length };

  try { out.locks = (await generateTodaysLocks()).length; } catch (e: any) { out.locksErr = e.message; }
  try { out.contest = (await getOrCreateThisWeekContest()).id; } catch (e: any) { out.contestErr = e.message; }

  // Mark game results from any finals + score contest entries
  try {
    const finals = games.filter(g => g.status === 'final' && g.home_score != null && g.away_score != null);
    const contests = (await q<any>('SELECT * FROM contests WHERE reward_granted = ?', [0])).results;
    for (const ct of contests) {
      const slate = JSON.parse(ct.slate);
      const winners: Record<string, 'home' | 'away'> = {};
      for (const g of slate) {
        const f = finals.find(fg => fg.id === g.id);
        if (f) winners[g.id] = (f.home_score! > f.away_score!) ? 'home' : 'away';
      }
      if (Object.keys(winners).length === 0) continue;
      const entries = (await q<any>('SELECT * FROM contest_entries WHERE contest_id = ?', [ct.id])).results;
      for (const e of entries) {
        const picks = JSON.parse(e.picks);
        let score = 0;
        for (const id of Object.keys(winners)) if (picks[id] === winners[id]) score++;
        await exec('UPDATE contest_entries SET score = ? WHERE id = ?', [score, e.id]);
      }
      // If all games settled, grant winner
      if (Object.keys(winners).length === slate.length) {
        const top = (await q<any>('SELECT * FROM contest_entries WHERE contest_id = ? ORDER BY score DESC LIMIT 1', [ct.id])).results[0];
        if (top) {
          const grant = 1000 * 60 * 60 * 24 * 31;
          const subs = (await q<any>('SELECT * FROM subscriptions WHERE user_email = ?', [top.user_email])).results[0];
          const base = Math.max(Number(subs?.current_period_end ?? 0), Date.now());
          if (subs) {
            await exec('UPDATE subscriptions SET active = ?, tier = COALESCE(tier, ?), current_period_end = ? WHERE user_email = ?',
              [1, 'pro', base + grant, top.user_email]);
          } else {
            await exec(
              'INSERT INTO subscriptions (id, user_email, stripe_id, active, tier, current_period_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [crypto.randomUUID(), top.user_email, null, 1, 'pro', Date.now() + grant, Date.now()]);
          }
          await exec('UPDATE contests SET winner_email = ?, reward_granted = ? WHERE id = ?', [top.user_email, 1, ct.id]);
        }
      }
    }
    out.contestsScored = contests.length;
  } catch (e: any) { out.contestsErr = e.message; }

  // Daily email blast: send today's free lock to confirmed subscribers (rate-limited via KV flag)
  try {
    const today = new Date().toISOString().slice(0, 10);
    const kvKey = `blast:${today}`;
    const e = env();
    let already = false;
    if (e.CACHE) already = !!(await e.CACHE.get(kvKey));
    if (!already) {
      const free = (await q<any>('SELECT * FROM daily_locks WHERE date = ? AND tier_required = ? ORDER BY slot LIMIT 1', [today, 'free'])).results[0];
      if (free) {
        const subs = (await q<any>('SELECT * FROM email_subscribers WHERE confirmed = ?', [1])).results;
        const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
        let sent = 0;
        for (const s of subs.slice(0, 500)) {
          const unsub = `${appUrl}/api/email/unsubscribe?t=${s.unsub_token}`;
          await sendEmail({
            to: s.email,
            subject: `Today's free pick: ${free.matchup}`,
            html: `<h2>${free.matchup} — ${free.pick}</h2><p>Confidence: ${free.confidence}%</p><p>${free.reasoning}</p><p><a href="${appUrl}/locks">See all 4 locks (Pro)</a></p><hr><p style="font-size:11px;color:#888">21+, bet responsibly. <a href="${unsub}">Unsubscribe</a></p>`,
          });
          sent++;
        }
        out.blastSent = sent;
        if (e.CACHE) await e.CACHE.put(kvKey, '1', { expirationTtl: 60 * 60 * 30 });
      }
    } else {
      out.blastSkipped = true;
    }
  } catch (e: any) { out.blastErr = e.message; }

  // Push tickles (every cron run, but only when there's a fresh lock window — debounced via KV)
  try {
    const today = new Date().toISOString().slice(0, 10);
    const kvKey = `push-tickle:${today}`;
    const e2 = env();
    let pushAlready = false;
    if (e2.CACHE) pushAlready = !!(await e2.CACHE.get(kvKey));
    if (!pushAlready && e2.VAPID_PUBLIC_KEY && e2.VAPID_PRIVATE_KEY) {
      const subs = (await q<any>('SELECT * FROM push_subscriptions LIMIT 500', [])).results;
      let sent = 0;
      for (const s of subs) {
        const r = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, { title: 'New locks are up', body: 'Today\'s NFL locks just dropped.', url: '/locks' });
        if (r.ok) sent++;
      }
      out.pushSent = sent;
      if (e2.CACHE) await e2.CACHE.put(kvKey, '1', { expirationTtl: 60 * 60 * 12 });
    }
  } catch (e: any) { out.pushErr = e.message; }

  // Email drip: enqueue reactivations, then drain due jobs
  try { out.reactEnq = await enqueueReactivationCandidates(); } catch (e: any) { out.reactErr = e.message; }
  try { out.dripDrain = await drainEmailQueue(); } catch (e: any) { out.dripErr = e.message; }

  return NextResponse.json(out);
}
