// Email drip series: welcome (3 emails over 4 days) + reactivation (14d inactive).
import { exec, q } from './db';
import { env } from './env';
import { sendEmail } from './email';

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export type DripTemplate = 'welcome_1' | 'welcome_2' | 'welcome_3' | 'reactivation';

const SCHEDULE: { template: DripTemplate; offsetMs: number; campaign: string }[] = [
  { template: 'welcome_1', offsetMs: 0,         campaign: 'welcome_d0' },
  { template: 'welcome_2', offsetMs: 1 * DAY,   campaign: 'welcome_d1' },
  { template: 'welcome_3', offsetMs: 4 * DAY,   campaign: 'welcome_d4' },
];

export async function enqueueWelcomeDrip(email: string) {
  if (!email) return;
  const now = Date.now();
  for (const s of SCHEDULE) {
    try {
      await exec(
        'INSERT INTO email_queue (id, to_email, template, scheduled_for, utm_campaign, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), email, s.template, now + s.offsetMs, s.campaign, 'pending', now],
      );
    } catch { /* dup */ }
  }
}

export async function recordActivity(email: string) {
  if (!email) return;
  const now = Date.now();
  const row = (await q<any>('SELECT * FROM user_activity WHERE user_email = ?', [email])).results[0];
  if (row) {
    await exec(
      'UPDATE user_activity SET last_seen = ?, reactivation_sent_at = NULL WHERE user_email = ?',
      [now, email],
    );
  } else {
    await exec(
      'INSERT INTO user_activity (user_email, last_seen, reactivation_sent_at) VALUES (?, ?, ?)',
      [email, now, null],
    );
  }
}

export async function enqueueReactivationCandidates() {
  // Anyone inactive >= 14 days, never reactivated, with confirmed email — enqueue once.
  const cutoff = Date.now() - 14 * DAY;
  const rows = (await q<any>(
    'SELECT user_email FROM user_activity WHERE last_seen < ? AND (reactivation_sent_at IS NULL OR reactivation_sent_at = 0) LIMIT 200',
    [cutoff],
  )).results;
  let enq = 0;
  for (const r of rows) {
    const email = r.user_email;
    // Only enqueue if subscribed/confirmed (best-effort)
    try {
      const sub = (await q<any>('SELECT confirmed FROM email_subscribers WHERE email = ?', [email])).results[0];
      if (sub && !sub.confirmed) continue;
    } catch {}
    try {
      await exec(
        'INSERT INTO email_queue (id, to_email, template, scheduled_for, utm_campaign, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), email, 'reactivation', Date.now(), 'reactivation_d14', 'pending', Date.now()],
      );
      await exec('UPDATE user_activity SET reactivation_sent_at = ? WHERE user_email = ?', [Date.now(), email]);
      enq++;
    } catch {}
  }
  return enq;
}

function renderTemplate(template: DripTemplate, appUrl: string, campaign: string): { subject: string; html: string } {
  const utm = (path: string) => `${appUrl}${path}?utm_source=email&utm_campaign=${campaign}`;
  switch (template) {
    case 'welcome_1':
      return {
        subject: 'Welcome to PremiumSportsAi — your edge starts now',
        html: `<h2>Welcome aboard.</h2>
          <p>You just unlocked NFL insights powered by AI. Your free Lock of the Day drops every morning.</p>
          <p><a href="${utm('/locks')}">See today's free lock →</a></p>
          <p>Talk soon — the PremiumSportsAi crew</p>
          <hr><p style="font-size:11px;color:#888">21+, bet responsibly. 1-800-GAMBLER.</p>`,
      };
    case 'welcome_2':
      return {
        subject: 'Your free pick is live (and 3 more are locked)',
        html: `<h2>Pros lock all 4 picks.</h2>
          <p>The free Lock of the Day is one of four daily AI-graded picks. Pro members see all four, plus DFS optimizer, agent emails, no ads.</p>
          <p><a href="${utm('/pricing')}">Try Pro — $14.99/mo, cancel anytime →</a></p>`,
      };
    case 'welcome_3':
      return {
        subject: 'One Sunday of Pro pays for the year',
        html: `<h2>Sharpen up.</h2>
          <p>If you're betting Sunday slates anyway, one good unit on a Pro lock covers the month. Sharp tier adds reverse-line-movement alerts and our daily sharp lock.</p>
          <p><a href="${utm('/pricing')}">Upgrade now →</a></p>`,
      };
    case 'reactivation':
      return {
        subject: 'We miss you — fresh picks are stacking up',
        html: `<h2>We're holding picks for you.</h2>
          <p>It's been a couple weeks. Your AI Game Pulse, Locks, and DFS lineups have been running every day.</p>
          <p><a href="${utm('/locks')}">Catch up on today's picks →</a></p>`,
      };
  }
}

export async function drainEmailQueue(): Promise<{ sent: number; failed: number; total: number }> {
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const now = Date.now();
  const due = (await q<any>(
    'SELECT * FROM email_queue WHERE status = ? AND scheduled_for <= ? ORDER BY scheduled_for ASC LIMIT 200',
    ['pending', now],
  )).results;
  let sent = 0, failed = 0;
  for (const job of due) {
    const tmpl = renderTemplate(job.template as DripTemplate, appUrl, job.utm_campaign || job.template);
    const res = await sendEmail({ to: job.to_email, subject: tmpl.subject, html: tmpl.html });
    if (res.ok) {
      sent++;
      await exec(
        'UPDATE email_queue SET status = ?, sent_at = ? WHERE id = ?',
        ['sent', Date.now(), job.id],
      );
    } else {
      // If Resend is not configured (skipped) treat as sent-but-stub
      if ((res as any).skipped) {
        await exec(
          'UPDATE email_queue SET status = ?, sent_at = ? WHERE id = ?',
          ['sent', Date.now(), job.id],
        );
        sent++;
      } else {
        failed++;
        await exec('UPDATE email_queue SET status = ? WHERE id = ?', ['failed', job.id]);
      }
    }
  }
  return { sent, failed, total: due.length };
}

export async function recordEmailEvent(email: string, campaign: string, event: 'click' | 'convert', url?: string) {
  await exec(
    'INSERT INTO email_events (id, email, campaign, event, url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), email, campaign, event, url ?? null, Date.now()],
  );
}
