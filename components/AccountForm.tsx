'use client';
import { useState } from 'react';

type Tier = 'free' | 'pro' | 'sharp';

export function AccountForm({ email, stripeReady, isPremium, tier, renews }: { email: string | null; stripeReady: boolean; isPremium: boolean; tier?: Tier; renews?: string | null }) {
  const [input, setInput] = useState(email ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tipAmt, setTipAmt] = useState(5);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: input }),
    });
    setBusy(false);
    if (r.ok) location.reload();
    else setErr('Could not sign in.');
  }

  async function subscribe(plan: 'pro' | 'sharp') {
    setBusy(true); setErr(null);
    const r = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await r.json();
    setBusy(false);
    if (data.url) location.href = data.url;
    else setErr(data.error ?? 'Checkout unavailable.');
  }

  async function tip() {
    setBusy(true); setErr(null);
    const r = await fetch('/api/stripe/tip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: tipAmt }),
    });
    const data = await r.json();
    setBusy(false);
    if (data.url) location.href = data.url;
    else setErr(data.error ?? 'Tip checkout unavailable.');
  }

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    location.reload();
  }

  return (
    <div className="space-y-4">
      {!email && (
        <form onSubmit={signIn} className="card space-y-3">
          <h2 className="font-bold">Sign in</h2>
          <input type="email" required value={input} onChange={e => setInput(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-ink border border-edge rounded-lg p-3 focus:outline-none focus:border-accent" />
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">Continue</button>
          <p className="text-xs text-zinc-500">v1 uses a signed-cookie session. Magic-link email is wired and active once RESEND_API_KEY is set.</p>
        </form>
      )}

      {email && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-bold">{email}</p>
            <p className="text-xs text-zinc-400">
              {isPremium ? `${tier === 'sharp' ? 'Sharp' : 'Pro'} · active${renews ? ` · renews ${renews}` : ''}` : 'Free plan'}
            </p>
          </div>
          <button onClick={signOut} className="btn-ghost text-sm">Sign out</button>
        </div>
      )}

      {email && !isPremium && (
        <div className="card">
          <h2 className="font-bold">Upgrade</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <button onClick={() => subscribe('pro')} disabled={busy || !stripeReady} className="btn-primary disabled:opacity-50">
              Pro · $14.99/mo
            </button>
            <button onClick={() => subscribe('sharp')} disabled={busy || !stripeReady} className="btn-ghost border-amber-500/40 hover:border-amber-400 disabled:opacity-50">
              Sharp · $29.99/mo
            </button>
          </div>
          {!stripeReady && <p className="text-xs text-zinc-500 mt-2">Set STRIPE_SECRET_KEY (sk_live_…) + STRIPE_PRICE_PRO / STRIPE_PRICE_SHARP. See SETUP.md.</p>}
        </div>
      )}

      {email && (
        <div className="card">
          <h2 className="font-bold">Tip jar</h2>
          <p className="text-zinc-400 text-sm">Keep the lights on. One-time, any amount.</p>
          <div className="mt-3 flex items-center gap-2">
            <select value={tipAmt} onChange={e => setTipAmt(Number(e.target.value))} className="bg-ink border border-edge rounded-lg p-2">
              {[1, 3, 5, 10, 20, 50].map(v => <option key={v} value={v}>${v}</option>)}
            </select>
            <button onClick={tip} disabled={busy || !stripeReady} className="btn-ghost disabled:opacity-50">Tip via Stripe</button>
          </div>
        </div>
      )}

      {err && <p className="text-bad text-sm">{err}</p>}
    </div>
  );
}
