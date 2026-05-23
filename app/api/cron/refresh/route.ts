import { NextResponse } from 'next/server';
import { listGames } from '@/lib/sports';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const expected = env().SESSION_SECRET; // reuse as shared secret in v1; replace with CRON_SECRET binding later
  if (expected && url.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const games = await listGames(); // populates KV
  return NextResponse.json({ ok: true, refreshed: games.length });
}
