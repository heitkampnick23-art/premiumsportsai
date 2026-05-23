import Link from 'next/link';
import { getMyTier } from '@/lib/tier';

export async function AdSlot({ placement = 'inline' }: { placement?: 'inline' | 'sidebar' | 'footer' }) {
  const tier = await getMyTier();
  if (tier !== 'free') return null;
  return (
    <div
      data-carbon
      data-carbon-placement={placement}
      className="card border-dashed border-edge bg-zinc-900/40 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-zinc-500">Sponsored</p>
      <p className="mt-2 font-bold">Go Pro — remove ads + unlock every lock</p>
      <p className="text-sm text-zinc-400">All 4 daily locks · DFS optimizer · Bet Lab edges · No ads</p>
      <Link href="/pricing" className="btn-primary inline-block mt-3">Start Pro · $14.99/mo</Link>
    </div>
  );
}
