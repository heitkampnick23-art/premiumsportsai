import Link from 'next/link';
import { env } from '@/lib/env';
import { q } from '@/lib/db';
import { summarize } from '@/lib/ab';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const TIER_PRICE_CENTS: Record<string, number> = { pro: 1499, sharp: 2999, annual: 12_42 /* monthly equivalent of $149/yr */ };

export default async function AdminDashboard({ searchParams }: { searchParams: { key?: string } }) {
  const expected = env().SESSION_SECRET;
  if (!expected || searchParams.key !== expected) {
    return <div className="card"><h1 className="font-bold">Forbidden</h1><p className="text-sm text-zinc-400 mt-1">Pass <code>?key=$SESSION_SECRET</code>.</p></div>;
  }

  // MRR
  let mrrCents = 0;
  let activeSubs: any[] = [];
  try {
    activeSubs = (await q<any>('SELECT tier, COUNT(*) as n FROM subscriptions WHERE active = 1 GROUP BY tier', [])).results;
    for (const r of activeSubs) {
      const price = TIER_PRICE_CENTS[String(r.tier ?? 'pro')] ?? 1499;
      mrrCents += price * Number(r.n);
    }
  } catch {}

  // Tips
  let tipsCents = 0, tipsCount = 0;
  try {
    const r = (await q<any>('SELECT COALESCE(SUM(amount_cents),0) as s, COUNT(*) as n FROM tips', [])).results[0];
    tipsCents = Number(r?.s ?? 0); tipsCount = Number(r?.n ?? 0);
  } catch {}

  // Affiliate clicks by book
  let aff: any[] = [];
  try {
    aff = (await q<any>('SELECT book, COUNT(*) as n FROM affiliate_clicks GROUP BY book ORDER BY n DESC LIMIT 30', [])).results;
  } catch {}

  // Signups last 14 days (rolling)
  const days: { date: string; n: number }[] = [];
  try {
    const cutoff = Date.now() - 14 * 86_400_000;
    const rows = (await q<any>('SELECT created_at FROM users WHERE created_at >= ?', [cutoff])).results;
    const map: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      map[d] = 0;
    }
    for (const r of rows) {
      const d = new Date(Number(r.created_at)).toISOString().slice(0, 10);
      if (d in map) map[d]++;
    }
    days.push(...Object.entries(map).map(([date, n]) => ({ date, n: Number(n) })));
  } catch {}
  const maxN = Math.max(1, ...days.map((d) => d.n));

  // Top takes
  let topTakes: any[] = [];
  try {
    topTakes = (await q<any>('SELECT * FROM takes ORDER BY clout DESC LIMIT 10', [])).results;
  } catch {}

  // Push subscriber count
  let pushN = 0;
  try {
    pushN = Number((await q<any>('SELECT COUNT(*) as n FROM push_subscriptions', [])).results[0]?.n ?? 0);
  } catch {}

  // Pool revenue (gross + operator share)
  let poolGrossCents = 0;
  try {
    const r = (await q<any>(`
      SELECT COALESCE(SUM(p.entry_fee_cents),0) as gross
      FROM pool_entries e JOIN pools p ON p.id = e.pool_id
      WHERE e.paid = 1`, [])).results[0];
    poolGrossCents = Number(r?.gross ?? 0);
  } catch {}
  const poolRakeCents = Math.floor(poolGrossCents * 0.15);

  // AB summary
  let ab: any[] = [];
  try { ab = await summarize(); } catch {}

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Operator Dashboard</h1>
        <p className="text-zinc-400 text-sm">Live metrics. <Link href={`/admin/sponsor?key=${expected}`} className="underline">Sponsor manager</Link> · <Link href={`/admin/ab?key=${expected}`} className="underline">A/B detail</Link></p>
      </header>

      <section className="grid md:grid-cols-4 gap-3">
        <Stat label="MRR" value={`$${(mrrCents / 100).toFixed(0)}`} sub={`${activeSubs.reduce((a,r)=>a+Number(r.n),0)} active subs`} />
        <Stat label="Tips (lifetime)" value={`$${(tipsCents / 100).toFixed(0)}`} sub={`${tipsCount} txns`} />
        <Stat label="Pool gross" value={`$${(poolGrossCents / 100).toFixed(0)}`} sub={`Rake: $${(poolRakeCents/100).toFixed(0)}`} />
        <Stat label="Push subs" value={String(pushN)} sub="encrypted web push" />
      </section>

      <section className="card">
        <h2 className="font-bold">Signups (last 14 days)</h2>
        <div className="flex items-end gap-1 h-32 mt-3">
          {days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${d.date}: ${d.n}`}>
              <div className="w-full bg-accent rounded-t" style={{ height: `${(d.n / maxN) * 100}%`, minHeight: 2 }} />
              <div className="text-[10px] text-zinc-500">{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-bold mb-2">Affiliate clicks by book</h2>
          <ul className="text-sm space-y-1">
            {aff.map((a) => <li key={a.book} className="flex justify-between"><span>{a.book}</span><strong>{a.n}</strong></li>)}
            {aff.length === 0 && <li className="text-zinc-500">No clicks yet.</li>}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-bold mb-2">A/B Pricing summary</h2>
          <table className="text-sm w-full">
            <thead><tr className="text-zinc-400"><th className="text-left">Variant</th><th>Views</th><th>Start</th><th>Done</th><th>Conv%</th></tr></thead>
            <tbody>
              {ab.map((r) => (
                <tr key={r.variant} className="border-t border-edge">
                  <td className="py-1 font-bold">{r.variant}</td>
                  <td className="text-center">{r.views}</td>
                  <td className="text-center">{r.starts}</td>
                  <td className="text-center">{r.completes}</td>
                  <td className="text-center text-accent">{(r.completeRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="font-bold mb-2">Top takes</h2>
        <ul className="text-sm space-y-2">
          {topTakes.map((t) => (
            <li key={t.id} className="border-b border-edge pb-2">
              <p>{t.text}</p>
              <p className="text-xs text-zinc-500">{t.user_email} · clout {t.clout} · grade {t.grade}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase text-zinc-400">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
