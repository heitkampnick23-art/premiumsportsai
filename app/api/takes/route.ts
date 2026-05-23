import { NextResponse } from 'next/server';
import { gradeTake } from '@/lib/ai';
import { getGame } from '@/lib/sports';
import { exec, q } from '@/lib/db';
import { readEmail } from '@/lib/auth';

export const runtime = 'edge';

export async function GET() {
  const r = await q<any>('SELECT * FROM takes ORDER BY created_at DESC LIMIT 50');
  return NextResponse.json({ takes: r.results });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? '').slice(0, 400).trim();
  const gameId = body.game_id ? String(body.game_id) : null;
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const email = (await readEmail()) ?? 'anon@premiumsportsai.com';
  const game = gameId ? await getGame(gameId) : undefined;
  const graded = await gradeTake(text, game ?? undefined);

  const id = crypto.randomUUID();
  const now = Date.now();
  const clout = Math.max(1, Math.round((100 - graded.grade) / 10) + 5); // bolder takes get more clout potential
  await exec(
    'INSERT INTO takes (id, user_email, game_id, text, grade, rationale, clout, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, email, gameId, text, graded.grade, graded.rationale, clout, now]
  );

  return NextResponse.json({ id, grade: graded.grade, rationale: graded.rationale, clout });
}
