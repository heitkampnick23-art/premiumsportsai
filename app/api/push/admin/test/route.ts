import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { sendPushToUser } from '@/lib/push';

export const runtime = 'edge';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const expected = env().SESSION_SECRET;
  if (!expected || url.searchParams.get('key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? '').toLowerCase();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const result = await sendPushToUser(userId, {
    title: String(body.title ?? 'PremiumSportsAi'),
    body: String(body.body ?? 'Test push'),
    url: body.url ? String(body.url) : '/',
    tag: body.tag ? String(body.tag) : 'admin-test',
  });
  return NextResponse.json({ ok: true, ...result });
}
