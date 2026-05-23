import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NFL_TEAMS, teamBySlug } from '@/lib/nfl-teams';
import { listGames } from '@/lib/sports';
import { q } from '@/lib/db';

export const runtime = 'edge';
export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const t = teamBySlug(params.slug);
  if (!t) return { title: 'Team — PremiumSportsAi' };
  return {
    title: `${t.name} — News, AI takes, locks | PremiumSportsAi`,
    description: `Latest ${t.name} news, AI take of the day, upcoming schedule, top user takes, and team-focused chat.`,
  };
}

function nameMatches(g: any, t: { name: string; mascot: string; abbr: string }) {
  const hay = `${g.home?.name ?? ''} ${g.away?.name ?? ''} ${g.home?.abbr ?? ''} ${g.away?.abbr ?? ''}`.toLowerCase();
  return hay.includes(t.name.toLowerCase()) || hay.includes(t.mascot.toLowerCase()) || hay.includes(t.abbr.toLowerCase());
}

export default async function TeamPage({ params }: { params: { slug: string } }) {
  const team = teamBySlug(params.slug);
  if (!team) notFound();

  const games = await listGames();
  const upcoming = games.filter((g) => g.status !== 'final' && nameMatches(g, team)).slice(0, 5);

  // Top user takes mentioning the team
  let topTakes: any[] = [];
  try {
    const all = (await q<any>('SELECT * FROM takes ORDER BY clout DESC LIMIT 200', [])).results;
    topTakes = all.filter((t: any) =>
      (t.text ?? '').toLowerCase().includes(team.name.toLowerCase()) ||
      (t.text ?? '').toLowerCase().includes(team.mascot.toLowerCase()) ||
      (t.text ?? '').toLowerCase().includes(team.abbr.toLowerCase())
    ).slice(0, 8);
  } catch {}

  // AI take of the day — pull a fresh lock that mentions team if available
  let aiTake: any = null;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const locks = (await q<any>('SELECT * FROM daily_locks WHERE date = ? ORDER BY slot ASC', [today])).results;
    aiTake = locks.find((l: any) =>
      (l.matchup ?? '').toLowerCase().includes(team.name.toLowerCase()) ||
      (l.matchup ?? '').toLowerCase().includes(team.mascot.toLowerCase()) ||
      (l.matchup ?? '').toLowerCase().includes(team.abbr.toLowerCase())
    ) ?? null;
  } catch {}

  const newsItems = [
    `${team.name} update: AI Game Pulse refreshed every 60 seconds with the latest line moves.`,
    `${team.mascot} betting trends and injury watchlist auto-synced from the latest feeds.`,
    `Reverse-line-movement detection on ${team.abbr} markets available to Sharp subscribers.`,
  ];

  return (
    <div className="space-y-6">
      <header
        className="card"
        style={{
          background: `linear-gradient(135deg, ${team.colors.primary}33, ${team.colors.secondary}22)`,
          borderColor: team.colors.primary,
        }}
      >
        <p className="text-xs uppercase tracking-widest">{team.conference} {team.division}</p>
        <h1 className="text-4xl font-black">{team.name}</h1>
        <p className="text-sm text-zinc-300 mt-1">AI takes, news, and locks for the {team.mascot}.</p>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-bold mb-2">Latest news</h2>
          <ul className="text-sm space-y-2">
            {newsItems.map((n) => <li key={n} className="text-zinc-300">· {n}</li>)}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-bold mb-2">AI take of the day</h2>
          {aiTake ? (
            <>
              <p className="text-lg font-bold">{aiTake.matchup} — {aiTake.pick}</p>
              <p className="text-xs text-zinc-400 mt-1">Confidence {aiTake.confidence}%</p>
              <p className="text-sm text-zinc-300 mt-2">{aiTake.reasoning}</p>
              <Link href="/locks" className="btn-ghost inline-block mt-3 text-xs">See all today's locks →</Link>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-400">No AI lock for the {team.mascot} today. New picks drop daily.</p>
              <Link href="/locks" className="btn-ghost inline-block mt-3 text-xs">Browse today's locks →</Link>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Upcoming games</h2>
        {upcoming.length ? (
          <ul className="space-y-2 text-sm">
            {upcoming.map((g) => (
              <li key={g.id} className="flex justify-between">
                <span>{g.away.name} @ {g.home.name}</span>
                <Link href={`/games/${g.id}`} className="underline text-accent">Pulse →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">No upcoming games on the slate right now.</p>
        )}
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Top fan takes</h2>
        {topTakes.length ? (
          <ul className="space-y-2 text-sm">
            {topTakes.map((t) => (
              <li key={t.id} className="border-b border-edge pb-2">
                <p>{t.text}</p>
                <p className="text-xs text-zinc-500 mt-1">Grade {t.grade}/100 · Clout {t.clout}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">No fan takes about the {team.mascot} yet. <Link className="underline" href="/takes">Be the first.</Link></p>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/chat?team=${team.abbr}`} className="btn-primary">Chat about the {team.mascot} →</Link>
        <Link href="/locks" className="btn-ghost">Today's locks</Link>
      </div>
    </div>
  );
}
