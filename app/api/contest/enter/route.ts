import { NextResponse } from 'next/server';
import { readEmail } from '@/lib/auth';
import { exec, q } from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const contestId = String(body.contest_id ?? '');
  const picks = body.picks ?? {};
  if (!contestId) return NextResponse.json({ error: 'contest_id required' }, { status: 400 });
  const existing = (await q<any>('SELECT id FROM contest_entries WHERE contest_id = ? AND user_email = ?', [contestId, email])).results[0];
  if (existing) {
    await exec('UPDATE contest_entries SET picks = ? WHERE id = ?', [JSON.stringify(picks), existing.id]);
  } else {
    await exec(
      'INSERT INTO contest_entries (id, contest_id, user_email, picks, score, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), contestId, email, JSON.stringify(picks), 0, Date.now()],
    );
  }
  return NextResponse.json({ ok: true });
}
