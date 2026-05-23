import Link from 'next/link';
import { notFound } from 'next/navigation';
import { emailForHandle, profileForEmail } from '@/lib/profile';
import { StreakBadge } from '@/components/StreakBadge';
import { env } from '@/lib/env';

export const runtime = 'edge';
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { handle: string } }) {
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const og = `${appUrl}/api/og/profile/${params.handle}`;
  const title = `@${params.handle} — PremiumSportsAi`;
  return {
    title,
    description: `NFL takes, clout, streak, and badges for @${params.handle}.`,
    openGraph: { title, images: [og] },
    twitter: { card: 'summary_large_image', images: [og] },
  };
}

export default async function ProfilePage({ params }: { params: { handle: string } }) {
  const email = await emailForHandle(params.handle);
  if (!email) notFound();
  const p = await profileForEmail(email);
  const accuracy = p.takes.total ? Math.round((p.takes.hits / p.takes.total) * 100) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="card">
        <p className="text-xs uppercase tracking-widest text-zinc-400">Profile</p>
        <h1 className="text-3xl font-black">@{p.handle}</h1>
        <p className="text-zinc-400 text-sm">Clout {p.takes.clout} · {p.takes.total} graded takes{accuracy !== null && ` · ${accuracy}% hit rate`}</p>
        <div className="mt-3"><StreakBadge current={p.streak.current} best={p.streak.best} badges={p.streak.badges} /></div>
      </header>

      <div className="grid md:grid-cols-3 gap-3 text-center">
        <div className="card"><p className="text-2xl font-black">{p.takes.clout}</p><p className="text-xs text-zinc-400">Clout</p></div>
        <div className="card"><p className="text-2xl font-black">{p.streak.best}d</p><p className="text-xs text-zinc-400">Best streak</p></div>
        <div className="card"><p className="text-2xl font-black">{p.referrals}</p><p className="text-xs text-zinc-400">Friends invited</p></div>
      </div>

      {p.fav_teams.length > 0 && (
        <section className="card">
          <h2 className="font-bold mb-2">Favorite teams</h2>
          <div className="flex flex-wrap gap-2">
            {p.fav_teams.map(t => <span key={t} className="badge bg-accent/20 text-accent">{t}</span>)}
          </div>
        </section>
      )}

      <Link href="/leaderboard" className="btn-ghost inline-block">View leaderboard →</Link>
    </div>
  );
}
