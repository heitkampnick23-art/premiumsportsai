import Link from 'next/link';
import { q } from '@/lib/db';
import { handleForEmail } from '@/lib/profile';

export const runtime = 'edge';
export const revalidate = 120;

export const metadata = {
  title: 'PremiumSportsAi — Leaderboard & Hall of Fame',
  description: 'Top NFL takes, longest streaks, and most-invited friends across the PremiumSportsAi community.',
  alternates: { canonical: '/leaderboard' },
};

async function topByClout() {
  const rows = (await q<any>('SELECT user_email, SUM(clout) as clout FROM takes GROUP BY user_email ORDER BY clout DESC LIMIT 25', [])).results;
  return Promise.all(rows.map(async r => ({ handle: await handleForEmail(r.user_email), clout: Number(r.clout ?? 0) })));
}
async function topByStreak() {
  const rows = (await q<any>('SELECT * FROM user_streaks ORDER BY best_streak DESC LIMIT 25', [])).results;
  return Promise.all(rows.map(async r => ({ handle: await handleForEmail(r.user_email), best: r.best_streak ?? 0, current: r.current_streak ?? 0 })));
}
async function topReferrers() {
  const rows = (await q<any>('SELECT referrer_email, COUNT(*) as n FROM referrals WHERE status = ? GROUP BY referrer_email ORDER BY n DESC LIMIT 25', ['granted'])).results;
  return Promise.all(rows.map(async r => ({ handle: await handleForEmail(r.referrer_email), n: Number(r.n) })));
}

export default async function LeaderboardPage() {
  const [clout, streak, refs] = await Promise.all([topByClout(), topByStreak(), topReferrers()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Leaderboard · Hall of Fame</h1>
        <p className="text-zinc-400">Top NFL takes, longest streaks, biggest referrers. Updated continuously.</p>
      </header>
      <div className="grid md:grid-cols-3 gap-4">
        <Board title="Clout (AI-graded)" rows={clout.map(r => ({ label: r.handle, value: String(r.clout) }))} link />
        <Board title="Longest streak" rows={streak.map(r => ({ label: r.handle, value: `${r.best}d` }))} link />
        <Board title="Top referrers" rows={refs.map(r => ({ label: r.handle, value: `${r.n} pro` }))} link />
      </div>
    </div>
  );
}

function Board({ title, rows, link }: { title: string; rows: { label: string; value: string }[]; link?: boolean }) {
  return (
    <section className="card">
      <h2 className="font-bold">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-zinc-500 mt-2">Be the first to land here.</p>}
      <ol className="mt-3 space-y-1 text-sm">
        {rows.map((r, i) => (
          <li key={r.label + i} className="flex items-center justify-between">
            <span className="text-zinc-300">
              <span className="text-zinc-500 w-6 inline-block">{i + 1}.</span>
              {link ? <Link href={`/u/${r.label}`} className="hover:text-accent">@{r.label}</Link> : `@${r.label}`}
            </span>
            <span className="font-bold">{r.value}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
