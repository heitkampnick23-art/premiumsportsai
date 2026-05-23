import Link from 'next/link';
import { readEmail } from '@/lib/auth';
import { getTier } from '@/lib/tier';
import { has } from '@/lib/env';
import { CheckoutButton } from '@/components/CheckoutButton';

export const runtime = 'edge';

const tiers = [
  {
    key: 'free' as const,
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    features: [
      '1 free Lock of the Day',
      'Limited Game Pulse previews',
      'Hot Takes posting + AI grade',
      'Public profile + leaderboard',
      '5 AI team-chat messages/day',
      'Ads supported',
    ],
    cta: 'Current plan',
    priceKey: null,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '$14.99',
    cadence: '/month',
    highlighted: true,
    features: [
      'All 4 Locks of the Day unlocked',
      'Unlimited AI Game Pulse + Bet Lab edges',
      'DFS Lineup Optimizer (DK / FD)',
      'Agent emails + push notifications',
      'Unlimited team chat (Haiku)',
      'No ads',
    ],
    cta: 'Start Pro',
    priceKey: 'pro',
  },
  {
    key: 'sharp' as const,
    name: 'Sharp',
    price: '$29.99',
    cadence: '/month',
    features: [
      'Everything in Pro, plus:',
      'Daily Sharp Lock w/ market-signal analysis',
      'Reverse-line-movement alerts',
      'Steam tracker + line history',
      'Priority push for injury news',
      'Sharp-only Discord (coming soon)',
    ],
    cta: 'Go Sharp',
    priceKey: 'sharp',
  },
];

export default async function PricingPage() {
  const email = await readEmail();
  const current = await getTier(email);
  const stripeReady = has('STRIPE_SECRET_KEY');

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-black">Pick your edge</h1>
        <p className="text-zinc-400 mt-2">Stripe live, cancel anytime. Pro and Sharp pay for themselves with one good Sunday.</p>
        {!email && <p className="mt-3 text-sm"><Link href="/account" className="underline">Sign in</Link> first to subscribe.</p>}
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map(t => {
          const isCurrent = current === t.key;
          const canStart = email && stripeReady && t.priceKey && !isCurrent;
          return (
            <div key={t.key}
              className={`card flex flex-col ${t.highlighted ? 'border-accent ring-1 ring-accent/30' : ''}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">{t.name}</h2>
                {isCurrent && <span className="badge bg-emerald-500/20 text-emerald-300">Active</span>}
              </div>
              <p className="mt-2"><span className="text-3xl font-black">{t.price}</span><span className="text-zinc-400">{t.cadence}</span></p>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {t.features.map(f => <li key={f} className="text-zinc-300">· {f}</li>)}
              </ul>
              <div className="mt-4">
                {t.priceKey && canStart ? (
                  <CheckoutButton plan={t.priceKey as 'pro' | 'sharp'} label={t.cta} />
                ) : t.priceKey && !email ? (
                  <Link href="/account" className="btn-primary block text-center">Sign in to start</Link>
                ) : (
                  <button disabled className="btn-ghost w-full opacity-60 cursor-not-allowed">{isCurrent ? t.cta : 'Currently on this plan'}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="card text-xs text-zinc-500 space-y-1">
        <p>All plans renew monthly. Cancel any time from Account → Billing.</p>
        <p>Informational service only — not a sportsbook. 21+, must be in a permitted jurisdiction. Bet responsibly. 1-800-GAMBLER.</p>
      </section>
    </div>
  );
}
