import Link from 'next/link';
import { readEmail } from '@/lib/auth';
import { q } from '@/lib/db';
import { AgentSettings } from '@/components/AgentSettings';
import { AgentInbox } from '@/components/AgentInbox';
import { getOrCreateReferralCode, referralStats } from '@/lib/referral';
import { profileForEmail } from '@/lib/profile';
import { StreakBadge } from '@/components/StreakBadge';
import { PushOptIn } from '@/components/PushOptIn';
import { ReferralPanel } from '@/components/ReferralPanel';
import { HandleEditor } from '@/components/HandleEditor';
import { env } from '@/lib/env';

export const runtime = 'edge';

const NFL_TEAMS = ['ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LAC','LAR','LV','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS'];

export default async function AgentPage() {
  const email = await readEmail();

  if (!email) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-black">Personal Fan Agent</h1>
          <p className="text-zinc-400">Pick your teams and tone. Pre-game briefings, post-game recaps, push alerts.</p>
        </header>
        <div className="card border-accent/40">
          <p className="font-bold">Sign in to set up your agent.</p>
          <p className="text-zinc-400 text-sm mt-1">Head to <Link href="/account" className="underline text-accent2">Account</Link>.</p>
        </div>
      </div>
    );
  }

  const settingsR = await q<any>('SELECT * FROM agent_settings WHERE user_email = ?', [email]);
  const settings = settingsR.results[0] ?? { teams: '', tone: 'analyst' };
  const teams = (typeof settings.teams === 'string' ? settings.teams.split(',').filter(Boolean) : []);
  const msgs = (await q<any>('SELECT * FROM agent_messages WHERE user_email = ? ORDER BY created_at DESC LIMIT 20', [email])).results;
  const profile = await profileForEmail(email);
  const refCode = await getOrCreateReferralCode(email);
  const refStats = await referralStats(email);
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const refUrl = `${appUrl}/r/${refCode}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Personal Fan Agent</h1>
          <p className="text-zinc-400">Your daily briefings + share + alerts in one place.</p>
        </div>
        <Link href={`/u/${profile.handle}`} className="btn-ghost text-sm">View public profile →</Link>
      </header>

      <section className="card">
        <h2 className="font-bold mb-3">You</h2>
        <StreakBadge current={profile.streak.current} best={profile.streak.best} badges={profile.streak.badges} />
        <div className="mt-4">
          <HandleEditor email={email} initialHandle={profile.handle} />
        </div>
      </section>

      <ReferralPanel code={refCode} url={refUrl} stats={refStats} />

      <section className="card">
        <h2 className="font-bold">Notifications</h2>
        <p className="text-sm text-zinc-400 mt-1">Get push for pre-game previews, injury news, and take-grade updates.</p>
        <div className="mt-3"><PushOptIn /></div>
      </section>

      <AgentSettings email={email} initialTeams={teams} initialTone={settings.tone} allTeams={NFL_TEAMS} />
      <AgentInbox initialMessages={msgs} email={email} />
    </div>
  );
}
