import Anthropic from '@anthropic-ai/sdk';
import { exec, q } from './db';
import { env } from './env';
import { listGames } from './sports';

export type ContestSlate = { id: string; matchup: string; ai_pick: 'home' | 'away' }[];

function sundayKey(d = new Date()): string {
  // Get the most recent Sunday (UTC) in YYYY-MM-DD
  const day = d.getUTCDay();
  const sun = new Date(d);
  sun.setUTCDate(sun.getUTCDate() - day);
  return sun.toISOString().slice(0, 10);
}

export async function getOrCreateThisWeekContest() {
  const week = sundayKey();
  try {
    const existing = (await q<any>('SELECT * FROM contests WHERE week_start = ?', [week])).results[0];
    if (existing) return existing;
  } catch { /* fall through to create */ }
  try {
    return await createThisWeekContest(week);
  } catch {
    // Synthesise an ephemeral contest if D1 unavailable
    const games = (await listGames()).slice(0, 5);
    const slate: ContestSlate = games.map(g => ({
      id: g.id, matchup: `${g.away.abbr} @ ${g.home.abbr}`,
      ai_pick: ((g.spread ?? 0) < 0 ? 'home' : 'away') as 'home' | 'away',
    }));
    return { id: `fb-${week}`, week_start: week, slate: JSON.stringify(slate), winner_email: null, reward_granted: 0, created_at: Date.now() };
  }
}

async function createThisWeekContest(week: string) {
  const games = (await listGames()).filter(g => g.status !== 'final').slice(0, 5);
  let aiPicks: Record<string, 'home' | 'away'> = {};
  const key = env().ANTHROPIC_API_KEY;
  if (key && games.length) {
    try {
      const c = new Anthropic({ apiKey: key });
      const m = await c.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `For each NFL game return STRICT JSON {"picks":{"<gameId>":"home"|"away"}}. Games: ${JSON.stringify(games.map(g => ({ id: g.id, home: g.home.abbr, away: g.away.abbr, spread: g.spread })))}`,
        }],
      });
      const text = (m.content[0] as any).text as string;
      aiPicks = JSON.parse(text).picks ?? {};
    } catch { /* fall through */ }
  }
  const slate: ContestSlate = games.map(g => ({
    id: g.id,
    matchup: `${g.away.abbr} @ ${g.home.abbr}`,
    ai_pick: (aiPicks[g.id] as any) || ((g.spread ?? 0) < 0 ? 'home' : 'away'),
  }));
  const id = crypto.randomUUID();
  await exec(
    'INSERT INTO contests (id, week_start, slate, winner_email, reward_granted, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, week, JSON.stringify(slate), null, 0, Date.now()],
  );
  return { id, week_start: week, slate: JSON.stringify(slate), winner_email: null, reward_granted: 0, created_at: Date.now() };
}
