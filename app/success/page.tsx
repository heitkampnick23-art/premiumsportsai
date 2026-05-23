import Link from 'next/link';
export const runtime = 'edge';

export default function Success({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type;
  return (
    <div className="card max-w-xl">
      <h1 className="text-2xl font-black">{type === 'tip' ? 'Thanks for the tip!' : 'Welcome to Premium.'}</h1>
      <p className="text-zinc-400 mt-2">
        {type === 'tip' ? 'Genuinely appreciated. The lights stay on.' : 'Your account is upgraded. All Premium features are unlocked.'}
      </p>
      <div className="mt-4 flex gap-2">
        <Link href="/games" className="btn-primary">Open Game Pulse</Link>
        <Link href="/account" className="btn-ghost">Back to account</Link>
      </div>
    </div>
  );
}
