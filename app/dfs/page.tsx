import Link from 'next/link';
import { readEmail } from '@/lib/auth';
import { getTier, tierAtLeast } from '@/lib/tier';
import { DfsBuilder } from '@/components/DfsBuilder';

export const runtime = 'edge';

export default async function DFSPage() {
  const email = await readEmail();
  const tier = await getTier(email);
  const allowed = tierAtLeast(tier, 'pro');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">DFS Lineup Optimizer</h1>
        <p className="text-zinc-400">3 AI-built lineups for DraftKings or FanDuel main slate. Cash + GPP construction.</p>
      </header>
      {!allowed ? (
        <section className="card border-accent/40">
          <h2 className="font-bold">Pro feature</h2>
          <p className="text-zinc-300 mt-2">DFS Optimizer is included with Pro ($14.99/mo) and Sharp ($29.99/mo).</p>
          <Link href="/pricing" className="btn-primary inline-block mt-3">Upgrade</Link>
        </section>
      ) : (
        <DfsBuilder />
      )}
      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/go/dk" className="btn-ghost">Open DraftKings →</a>
        <a href="/go/fd" className="btn-ghost">Open FanDuel →</a>
      </div>
    </div>
  );
}
