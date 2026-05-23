import Link from 'next/link';
import { NFL_TEAMS } from '@/lib/nfl-teams';

export const runtime = 'edge';
export const revalidate = 600;

export const metadata = {
  title: 'NFL Teams — AI takes, locks, and chat | PremiumSportsAi',
  description: 'AI-powered NFL team pages: latest news, upcoming games, take of the day, top user takes for all 32 teams.',
};

export default function TeamsIndex() {
  const byDiv: Record<string, typeof NFL_TEAMS> = {};
  for (const t of NFL_TEAMS) {
    const k = `${t.conference} ${t.division}`;
    (byDiv[k] ??= [] as any).push(t);
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">All 32 NFL Teams</h1>
        <p className="text-zinc-400">AI takes, locks, and team-specific chat for every franchise.</p>
      </header>
      {Object.entries(byDiv).map(([div, teams]) => (
        <section key={div}>
          <h2 className="font-bold mb-2">{div}</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {teams.map(t => (
              <li key={t.slug}>
                <Link
                  href={`/teams/${t.slug}`}
                  className="card block hover:border-accent"
                  style={{ borderLeftWidth: 4, borderLeftColor: t.colors.primary }}
                >
                  <div className="font-bold">{t.abbr}</div>
                  <div className="text-xs text-zinc-400">{t.name}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
