import Link from 'next/link';

export const runtime = 'edge';

const features = [
  {
    href: '/games',
    title: 'AI Game Pulse',
    blurb: 'Live win probabilities, key matchups, injury impact, and confidence-graded predictions for every NFL game.',
    cta: 'See games',
  },
  {
    href: '/bets',
    title: 'AI Bet Lab',
    blurb: 'Model-driven edges vs. consensus lines, EV%, Kelly stake sizing, tracked record.',
    cta: 'Find edges',
  },
  {
    href: '/agent',
    title: 'Personal Fan Agent',
    blurb: 'Pick your teams and tone (analyst / hype / salty). Get pre-game briefings and post-game recaps.',
    cta: 'Set up agent',
  },
  {
    href: '/takes',
    title: 'Hot Takes Arena',
    blurb: 'Post pre-game takes. AI grades them in real time. Climb the clout leaderboard.',
    cta: 'Throw a take',
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="card bg-gradient-to-br from-panel to-zinc-900 border-edge">
        <p className="text-accent2 text-xs font-bold uppercase tracking-widest">NFL · Powered by Claude</p>
        <h1 className="text-4xl md:text-5xl font-black mt-2">Smarter than your group chat. Faster than your bookie.</h1>
        <p className="mt-3 text-zinc-300 max-w-2xl">PremiumSportsAi turns raw NFL data into clear, confidence-graded insights. Four tools, one mission: win the week.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/games" className="btn-primary">Open Game Pulse</Link>
          <Link href="/account" className="btn-ghost">Premium · $14.99/mo</Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {features.map(f => (
          <Link key={f.href} href={f.href} className="card hover:border-accent transition group">
            <h2 className="text-xl font-bold group-hover:text-accent">{f.title}</h2>
            <p className="text-zinc-400 mt-2">{f.blurb}</p>
            <span className="inline-block mt-3 text-accent2 text-sm font-semibold">{f.cta} →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
