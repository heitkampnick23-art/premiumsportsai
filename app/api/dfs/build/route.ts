import { NextResponse } from 'next/server';
import { readEmail } from '@/lib/auth';
import { getTier, tierAtLeast } from '@/lib/tier';
import { buildLineups } from '@/lib/dfs';
import { exec } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const tier = await getTier(email);
  if (!tierAtLeast(tier, 'pro')) return NextResponse.json({ error: 'Pro tier required' }, { status: 402 });
  const body = await req.json().catch(() => ({}));
  const site = body.site === 'fd' ? 'fd' : 'dk';
  const slate = String(body.slate ?? 'Main Sunday').slice(0, 80);
  const lineups = await buildLineups({ site, slate });
  try {
    await exec(
      'INSERT INTO dfs_lineups (id, user_email, site, slate, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), email, site, slate, JSON.stringify(lineups), Date.now()],
    );
  } catch { /* non-fatal */ }
  return NextResponse.json({ lineups });
}
