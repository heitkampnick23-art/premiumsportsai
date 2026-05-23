import Link from 'next/link';
export const runtime = 'edge';
export const metadata = { title: 'Legal — PremiumSportsAi' };

export default function Legal() {
  const items = [
    { href: '/terms', title: 'Terms of Service', desc: 'Subscription rules, pool entry terms, no-guarantees policy, arbitration.' },
    { href: '/privacy', title: 'Privacy Policy', desc: 'What we collect, who we share it with, your access and deletion rights (GDPR/CCPA).' },
    { href: '/responsible-gambling', title: 'Responsible Gambling', desc: 'Warning signs, 1-800-GAMBLER, self-exclusion, the limits we enforce.' },
  ];
  return (
    <article className="prose prose-invert max-w-3xl space-y-4">
      <h1 className="text-3xl font-black">Legal</h1>
      <p>PremiumSportsAi is an information and entertainment service. We are <strong>not</strong> a sportsbook and do not accept wagers. Affiliate links direct to third-party licensed operators.</p>
      <div className="grid gap-3 not-prose">
        {items.map(i => (
          <Link key={i.href} href={i.href} className="block rounded-xl border border-edge p-4 hover:border-orange-500 transition">
            <div className="font-bold text-lg">{i.title}</div>
            <div className="text-sm text-zinc-400 mt-1">{i.desc}</div>
          </Link>
        ))}
      </div>
      <p className="text-sm text-zinc-400">Contact: <a href="mailto:heitkampnick23@gmail.com" className="underline">heitkampnick23@gmail.com</a></p>
    </article>
  );
}
