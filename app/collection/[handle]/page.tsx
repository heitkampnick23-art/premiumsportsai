import Link from 'next/link';
import { notFound } from 'next/navigation';
import { emailForHandle } from '@/lib/profile';
import { BADGES, getUserBadges, renderBadgeSvg } from '@/lib/badges';
import { env } from '@/lib/env';

export const runtime = 'edge';
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { handle: string } }) {
  const title = `@${params.handle}'s badge collection — PremiumSportsAi`;
  return {
    title,
    description: `Every badge @${params.handle} has earned: streaks, hits, referrals, contest wins.`,
    openGraph: { title },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function CollectionPage({ params }: { params: { handle: string } }) {
  const email = await emailForHandle(params.handle);
  if (!email) notFound();
  const earned = await getUserBadges(email);
  const appUrl = env().APP_URL ?? 'https://premiumsportsai.pages.dev';
  const all = Object.values(BADGES);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-400">Collection</p>
        <h1 className="text-3xl font-black">@{params.handle}'s badges</h1>
        <p className="text-zinc-400 text-sm">{earned.length} of {all.length} earned. Show them off.</p>
      </header>

      <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {all.map((b) => {
          const have = earned.includes(b.id);
          const svgInline = renderBadgeSvg(b.id, 256);
          const tweetText = have
            ? `I just unlocked the "${b.title}" badge on PremiumSportsAi. ${appUrl}/collection/${params.handle}`
            : `Chasing the "${b.title}" badge on PremiumSportsAi. ${appUrl}/collection/${params.handle}`;
          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
          return (
            <div key={b.id} className={`card ${have ? 'border-accent/60' : 'opacity-50'}`}>
              <div
                className="mx-auto mb-2"
                style={{ width: 160, height: 160 }}
                dangerouslySetInnerHTML={{ __html: svgInline.replace('width="256"', 'width="160"').replace('height="256"', 'height="160"') }}
              />
              <h3 className="font-bold text-center">{b.title}</h3>
              <p className="text-xs text-zinc-400 text-center">{b.subtitle}</p>
              {have ? (
                <a
                  className="btn-primary block text-center mt-3 text-sm"
                  href={tweetUrl} target="_blank" rel="noopener noreferrer"
                >Share on X</a>
              ) : (
                <p className="text-xs text-center text-zinc-500 mt-3">Locked</p>
              )}
            </div>
          );
        })}
      </section>

      <Link href={`/u/${params.handle}`} className="btn-ghost inline-block">← Back to profile</Link>
    </div>
  );
}
