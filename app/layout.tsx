import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PremiumSportsAi — AI-Powered NFL Insights',
  description: 'AI Game Pulse, Bet Lab, Personal Fan Agent, and Hot Takes Arena for NFL fans.',
};

const nav = [
  { href: '/locks', label: 'Locks' },
  { href: '/games', label: 'Game Pulse' },
  { href: '/bets', label: 'Bet Lab' },
  { href: '/dfs', label: 'DFS' },
  { href: '/contest', label: 'Contest' },
  { href: '/chat', label: 'Chat' },
  { href: '/takes', label: 'Hot Takes' },
  { href: '/teams', label: 'Teams' },
  { href: '/pools', label: 'Pools' },
  { href: '/leaderboard', label: 'Leaders' },
  { href: '/agent', label: 'Agent' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/account', label: 'Account' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-edge bg-ink/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-black tracking-tight text-lg">
              <span className="text-accent">Premium</span>SportsAi
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-300 overflow-x-auto">
              {nav.map(n => (
                <Link key={n.href} href={n.href} className="hover:text-white whitespace-nowrap">{n.label}</Link>
              ))}
            </nav>
            <div className="ml-auto">
              <Link href="/pricing" className="btn-primary text-sm">Pricing</Link>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-edge mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-zinc-400 space-y-2">
            <p>PremiumSportsAi is an insights and information service. We are NOT a sportsbook and do not accept wagers.</p>
            <p><strong>Gambling problem?</strong> Call 1-800-GAMBLER. Must be 21+ in most jurisdictions. Bet responsibly.</p>
            <p>© {new Date().getFullYear()} PremiumSportsAi · <Link href="/terms" className="underline">Terms</Link> · <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/responsible-gambling" className="underline">Responsible Gambling</Link></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
