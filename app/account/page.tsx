import { readEmail } from '@/lib/auth';
import { AccountForm } from '@/components/AccountForm';
import { has } from '@/lib/env';
import { q } from '@/lib/db';

export const runtime = 'edge';

export default async function AccountPage() {
  const email = await readEmail();
  const stripeReady = has('STRIPE_SECRET_KEY');
  const sub = email ? (await q<any>('SELECT * FROM subscriptions WHERE user_email = ?', [email])).results[0] : null;
  const tips = email ? (await q<any>('SELECT * FROM tips WHERE user_email = ?', [email])).results : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl font-black">Account</h1>
        <p className="text-zinc-400">Sign in with your email, manage Premium, drop a tip.</p>
      </header>

      <AccountForm email={email} stripeReady={stripeReady} isPremium={Boolean(sub?.active)} />

      {tips.length > 0 && (
        <section className="card">
          <h2 className="font-bold mb-2">Your tips</h2>
          <ul className="text-sm space-y-1">
            {tips.map(t => <li key={t.id}>${(t.amount_cents / 100).toFixed(2)} — {new Date(t.created_at).toLocaleDateString()}</li>)}
          </ul>
        </section>
      )}

      <section className="card text-xs text-zinc-500 space-y-2">
        <p><strong>Disclaimer:</strong> PremiumSportsAi provides analytical insights only. We are not a sportsbook and do not accept wagers. Bet responsibly — 21+. 1-800-GAMBLER.</p>
      </section>
    </div>
  );
}
