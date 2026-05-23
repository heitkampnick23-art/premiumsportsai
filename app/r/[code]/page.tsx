import Link from 'next/link';
import { cookies } from 'next/headers';
import { referrerEmailForCode } from '@/lib/referral';

export const runtime = 'edge';

export default async function ReferralLanding({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const referrer = await referrerEmailForCode(code);

  if (referrer) {
    // Stash the code in a cookie; consumed on signin
    cookies().set('psa_ref', code, {
      httpOnly: false,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <header className="text-center">
        <p className="text-accent2 text-xs uppercase tracking-widest">Friend invite</p>
        <h1 className="text-3xl font-black mt-1">You both get 30 days of Pro</h1>
        <p className="text-zinc-400 mt-2">
          Sign up via this link and start any paid plan. You and your friend each get a free 30-day Pro extension.
        </p>
      </header>
      {!referrer && (
        <p className="card text-bad">That referral code isn't valid — but you can still sign up.</p>
      )}
      <div className="card space-y-3">
        <h2 className="font-bold">Claim your bonus</h2>
        <ol className="text-sm text-zinc-300 list-decimal pl-5 space-y-1">
          <li>Sign in with your email</li>
          <li>Pick Pro ($14.99) or Sharp ($29.99)</li>
          <li>30 days added to both accounts automatically</li>
        </ol>
        <Link href="/account" className="btn-primary inline-block">Sign in to claim</Link>
      </div>
      <p className="text-xs text-zinc-500 text-center">No purchase required to browse — but the 30-day bonus only triggers on a paid plan.</p>
    </div>
  );
}
