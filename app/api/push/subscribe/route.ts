import { NextResponse } from 'next/server';
import { exec, q } from '@/lib/db';
import { readEmail } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  const body = await req.json().catch(() => ({}));
  const { endpoint, p256dh, auth, topics } = body;
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: 'missing keys' }, { status: 400 });
  const existing = (await q<any>('SELECT id FROM push_subscriptions WHERE endpoint = ?', [endpoint])).results[0];
  if (existing) {
    await exec('UPDATE push_subscriptions SET user_email = ?, p256dh = ?, auth = ?, topics = ? WHERE endpoint = ?',
      [email, p256dh, auth, JSON.stringify(topics ?? []), endpoint]);
  } else {
    await exec(
      'INSERT INTO push_subscriptions (id, user_email, endpoint, p256dh, auth, topics, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), email, endpoint, p256dh, auth, JSON.stringify(topics ?? []), Date.now()],
    );
  }
  return NextResponse.json({ ok: true });
}
