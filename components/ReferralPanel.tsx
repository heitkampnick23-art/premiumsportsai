'use client';
import { useState } from 'react';

export function ReferralPanel({ code, url, stats }: { code: string; url: string; stats: { total: number; granted: number; pending: number } }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <section className="card">
      <h2 className="font-bold">Refer a friend — both get 30 days of Pro</h2>
      <p className="text-sm text-zinc-400 mt-1">When they start any paid plan, 30 days are added to both accounts.</p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <code className="flex-1 bg-ink border border-edge rounded-lg px-3 py-2 text-sm overflow-x-auto whitespace-nowrap">{url}</code>
        <button onClick={copy} className="btn-primary text-sm">{copied ? 'Copied!' : 'Copy link'}</button>
      </div>
      <div className="mt-3 flex gap-3 text-xs text-zinc-400">
        <span>Code: <code className="text-accent">{code}</code></span>
        <span>Invites: <strong>{stats.total}</strong></span>
        <span>Granted: <strong className="text-emerald-300">{stats.granted}</strong></span>
        <span>Pending: <strong>{stats.pending}</strong></span>
      </div>
    </section>
  );
}
