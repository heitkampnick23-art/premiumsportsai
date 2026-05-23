import { NextResponse } from 'next/server';
import { readEmail } from '@/lib/auth';
import { exec, q } from '@/lib/db';
import { agentMessage } from '@/lib/ai';
import { listGames } from '@/lib/sports';
import { sendEmail } from '@/lib/email';

export const runtime = 'edge';

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');

  if (action === 'save') {
    const teams = Array.isArray(body.teams) ? body.teams.join(',') : '';
    const tone = ['analyst', 'hype', 'salty'].includes(body.tone) ? body.tone : 'analyst';
    const existing = await q<any>('SELECT * FROM agent_settings WHERE user_email = ?', [email]);
    if (existing.results.length) {
      await exec('UPDATE agent_settings SET teams = ?, tone = ? WHERE user_email = ?', [teams, tone, email]);
    } else {
      await exec('INSERT INTO agent_settings (id, user_email, teams, tone, created_at) VALUES (?, ?, ?, ?, ?)',
        [crypto.randomUUID(), email, teams, tone, Date.now()]);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'send') {
    const kind = body.kind === 'recap' ? 'recap' : 'pregame';
    const tone = ['analyst', 'hype', 'salty'].includes(body.tone) ? body.tone : 'analyst';
    const teams: string[] = Array.isArray(body.teams) ? body.teams : [];
    const games = await listGames();
    const msg = await agentMessage({ teams, tone, kind, games });
    await exec(
      'INSERT INTO agent_messages (id, user_email, subject, body, kind, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), email, msg.subject, msg.body, kind, Date.now()]
    );
    // Best-effort email (silently skipped if RESEND_API_KEY absent)
    await sendEmail({ to: email, subject: msg.subject, html: `<p>${msg.body.replace(/\n/g, '<br/>')}</p>` }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
