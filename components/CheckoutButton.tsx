'use client';
import { useState } from 'react';

export function CheckoutButton({ plan, label }: { plan: 'pro' | 'sharp'; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go() {
    setBusy(true); setErr(null);
    const r = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await r.json();
    if (data.url) location.href = data.url;
    else { setErr(data.error ?? 'Checkout error'); setBusy(false); }
  }
  return (
    <>
      <button onClick={go} disabled={busy} className="btn-primary w-full disabled:opacity-50">
        {busy ? 'Loading…' : label}
      </button>
      {err && <p className="text-bad text-xs mt-2">{err}</p>}
    </>
  );
}
