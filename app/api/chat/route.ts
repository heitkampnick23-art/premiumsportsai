import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readEmail } from '@/lib/auth';
import { env } from '@/lib/env';
import { getTier } from '@/lib/tier';
import { exec, q } from '@/lib/db';

export const runtime = 'edge';

const FREE_LIMIT = 5;
const SYSTEM = `You are PremiumSportsAi's NFL team analyst chat. Give concise, fan-friendly answers (under 180 words). Cite recent context when relevant. Avoid betting recommendations — give analysis only. If asked about lines, frame as "the model edge" rather than "you should bet".`;

function dayKey() { return new Date().toISOString().slice(0, 10); }

async function getUsage(email: string): Promise<number> {
  const day = dayKey();
  const e = env();
  if (e.CACHE) {
    const k = `chat:${email}:${day}`;
    const v = await e.CACHE.get(k);
    return Number(v ?? 0);
  }
  const r = await q<any>('SELECT count FROM chat_usage WHERE user_email = ? AND day = ?', [email, day]);
  return Number(r.results[0]?.count ?? 0);
}
async function bumpUsage(email: string): Promise<number> {
  const day = dayKey();
  const e = env();
  if (e.CACHE) {
    const k = `chat:${email}:${day}`;
    const cur = Number((await e.CACHE.get(k)) ?? 0) + 1;
    await e.CACHE.put(k, String(cur), { expirationTtl: 60 * 60 * 36 });
    return cur;
  }
  const cur = await getUsage(email);
  if (cur === 0) {
    await exec('INSERT INTO chat_usage (user_email, day, count) VALUES (?, ?, ?)', [email, day, 1]);
  } else {
    await exec('UPDATE chat_usage SET count = ? WHERE user_email = ? AND day = ?', [cur + 1, email, day]);
  }
  return cur + 1;
}

export async function POST(req: Request) {
  const email = await readEmail();
  if (!email) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const tier = await getTier(email);
  if (tier === 'free') {
    const u = await getUsage(email);
    if (u >= FREE_LIMIT) {
      return NextResponse.json({ error: `Free daily limit (${FREE_LIMIT}) reached. Upgrade to Pro for unlimited.`, count: u }, { status: 402 });
    }
  }
  const body = await req.json().catch(() => ({}));
  const team = String(body.team ?? 'NFL').slice(0, 40);
  const messages = (body.messages ?? []).slice(-12);
  const key = env().ANTHROPIC_API_KEY;
  let reply: string;
  if (!key) {
    reply = `Without an Anthropic key I'm running in stub mode — but here's the take on the ${team}: focus on EPA/play and recent injury report. Set ANTHROPIC_API_KEY for real answers.`;
  } else {
    try {
      const c = new Anthropic({ apiKey: key });
      const msg = await c.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
        messages: messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: `${m.role === 'user' ? `[team focus: ${team}] ` : ''}${m.text}`,
        })),
      });
      reply = (msg.content[0] as any).text as string;
    } catch (e: any) {
      reply = `Chat error: ${e.message}. Try again.`;
    }
  }
  let count = 0;
  if (tier === 'free') count = await bumpUsage(email);
  return NextResponse.json({ reply, count });
}
