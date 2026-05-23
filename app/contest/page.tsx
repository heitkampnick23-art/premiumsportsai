import Link from 'next/link';
import { readEmail } from '@/lib/auth';
import { getOrCreateThisWeekContest } from '@/lib/contest';
import { q } from '@/lib/db';
import { handleForEmail } from '@/lib/profile';
import { ContestForm } from '@/components/ContestForm';

export const runtime = 'edge';

export default async function ContestPage() {
  const email = await readEmail();
  const contest = await getOrCreateThisWeekContest();
  const slate = JSON.parse(contest.slate) as { id: string; matchup: string; ai_pick: 'home' | 'away' }[];
  const myEntry = email
    ? (await q<any>('SELECT * FROM contest_entries WHERE contest_id = ? AND user_email = ?', [contest.id, email])).results[0]
    : null;
  const top = (await q<any>('SELECT * FROM contest_entries WHERE contest_id = ? ORDER BY score DESC LIMIT 15', [contest.id])).results;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-accent2 text-xs font-bold uppercase tracking-widest">Week of {contest.week_start}</p>
        <h1 className="text-3xl font-black">AI vs You</h1>
        <p className="text-zinc-400">Pick winners for this week's 5 NFL games. Beat the AI. Top score wins a free month of Pro.</p>
      </header>
      {!email && (
        <p className="card"><Link href="/account" className="underline">Sign in</Link> to enter this week's contest — free.</p>
      )}
      {email && (
        <ContestForm contestId={contest.id} slate={slate} myPicks={myEntry?.picks ? JSON.parse(myEntry.picks) : {}} />
      )}
      <section className="card">
        <h2 className="font-bold">Live leaderboard</h2>
        {top.length === 0 && <p className="text-sm text-zinc-500 mt-2">No entries scored yet — be early.</p>}
        <ol className="mt-2 text-sm space-y-1">
          {await Promise.all(top.map(async (e, i) => (
            <li key={e.id} className="flex justify-between">
              <span><span className="text-zinc-500 w-6 inline-block">{i + 1}.</span>@{await handleForEmail(e.user_email)}</span>
              <span className="font-bold">{e.score}</span>
            </li>
          )))}
        </ol>
      </section>
    </div>
  );
}
