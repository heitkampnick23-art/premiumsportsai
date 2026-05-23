import { readEmail } from '@/lib/auth';
import { q } from '@/lib/db';
import { AgentSettings } from '@/components/AgentSettings';
import { AgentInbox } from '@/components/AgentInbox';

export const runtime = 'edge';

const NFL_TEAMS = ['ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LAC','LAR','LV','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS'];

export default async function AgentPage() {
  const email = await readEmail();
  const settingsR = email ? await q<any>('SELECT * FROM agent_settings WHERE user_email = ?', [email]) : { results: [] };
  const settings = settingsR.results[0] ?? { teams: '', tone: 'analyst' };
  const teams = (typeof settings.teams === 'string' ? settings.teams.split(',').filter(Boolean) : []);
  const msgs = email ? (await q<any>('SELECT * FROM agent_messages WHERE user_email = ? ORDER BY created_at DESC LIMIT 20', [email])).results : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Personal Fan Agent</h1>
        <p className="text-zinc-400">Pick your teams and tone. Your agent ships pre-game briefings and post-game recaps to your inbox here (and via email if Resend is set).</p>
      </header>

      {!email && (
        <div className="card border-accent/40">
          <p className="font-bold">Sign in to set up your agent.</p>
          <p className="text-zinc-400 text-sm mt-1">Head to <a href="/account" className="underline text-accent2">Account</a> to enter your email.</p>
        </div>
      )}

      {email && (
        <>
          <AgentSettings email={email} initialTeams={teams} initialTone={settings.tone} allTeams={NFL_TEAMS} />
          <AgentInbox initialMessages={msgs} email={email} />
        </>
      )}
    </div>
  );
}
