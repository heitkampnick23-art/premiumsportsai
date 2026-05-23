import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';
import type { Game } from '../data/fixtures';

const MODEL_BIG = 'claude-opus-4-7';
const MODEL_SMALL = 'claude-haiku-4-5-20251001';

function client(): Anthropic | null {
  const key = env().ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

// System prompt designed for prompt caching: stable, long.
const PULSE_SYSTEM = `You are PremiumSportsAi's NFL Game Pulse analyst.
You generate concise, data-grounded game previews for paying fans. Your tone is sharp, confident,
and free of hedging filler. You always return STRICT JSON matching the requested schema. Never
include any text outside the JSON.

Required fields:
- win_probability_home: number 0-100
- key_matchups: array of 3 short strings
- injury_impact: short paragraph (max 60 words)
- narrative: 2-3 sentence storyline preview
- prediction: { winner: 'home'|'away', score_home: int, score_away: int, confidence: 'low'|'medium'|'high', reasoning: short string }

You weigh: recent form, EPA differentials, situational splits, injury severity, line movement, and matchup-specific edges (e.g. mobile QB vs. soft edge rush). You do NOT recommend betting actions; you provide analytical insight only.`;

const BET_SYSTEM = `You are PremiumSportsAi's Bet Lab quant. For each game you compute:
- model_spread_home: your fair spread (negative = home favored)
- model_total: your fair total
- edges: array of { market: 'spread'|'total'|'ml', side: string, edge_pct: number (-100..100), kelly_pct: number (0..25) }
- summary: one-sentence rationale.
Return STRICT JSON only. Be honest about low-edge games (return empty edges if no clear value).`;

const TAKE_SYSTEM = `You are PremiumSportsAi's Hot Take Judge. Given a user's NFL prediction/opinion,
you grade the likelihood it comes true on a 0-100 scale and provide a one-sentence rationale.
Return STRICT JSON: { grade: int, rationale: string }. Be fair, not snarky. 50 = coin flip. 80+ = chalk.`;

const AGENT_SYSTEM = `You are the user's Personal NFL Fan Agent. You write short, personalized
messages (under 180 words) about their favorite teams. You adapt to the requested tone:
- analyst: measured, data-first, professional
- hype: energetic, fan-perspective, emoji OK
- salty: dry, sarcastic, blunt — never mean-spirited or profane.
Return STRICT JSON: { subject: string, body: string }`;

const NEWS_SYSTEM = `You cluster sports/AI news headlines, deduplicating near-identical stories
and tagging each cluster with one of: NFL, AI, BUSINESS, RUMOR. Return STRICT JSON:
{ clusters: [{ headline: string, tag: string, items: [{title, source, url}] }] }`;

export async function pulseFor(game: Game) {
  const c = client();
  const fallback = {
    win_probability_home: game.spread != null ? Math.round(50 - game.spread * 2.5) : 55,
    key_matchups: [
      `${game.home.abbr} pass rush vs. ${game.away.abbr} OL`,
      `${game.away.abbr} explosive plays vs. ${game.home.abbr} secondary`,
      `Red zone efficiency battle`,
    ],
    injury_impact: game.injuries?.length
      ? `Watch ${game.injuries.map(i => `${i.name} (${i.status})`).join(', ')}.`
      : 'No major injury concerns reported.',
    narrative: `${game.away.name} travel to face ${game.home.name} in a pivotal matchup. Both teams enter with playoff implications. Expect a physical, possession-heavy game.`,
    prediction: { winner: 'home', score_home: 24, score_away: 20, confidence: 'medium', reasoning: 'Home field + healthier roster.' },
  };
  if (!c) return fallback;
  try {
    const msg = await c.messages.create({
      model: MODEL_BIG,
      max_tokens: 800,
      system: [{ type: 'text', text: PULSE_SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
      messages: [{ role: 'user', content: `Generate Game Pulse JSON for: ${JSON.stringify(game)}` }],
    });
    const text = (msg.content[0] as any).text as string;
    return JSON.parse(text);
  } catch { return fallback; }
}

export async function betLabFor(games: Game[]) {
  const c = client();
  const fallback = games.slice(0, 6).map(g => ({
    game_id: g.id,
    model_spread_home: g.spread != null ? g.spread - 0.5 : 0,
    model_total: g.total ?? 45,
    edges: g.spread != null && Math.abs(g.spread) > 3
      ? [{ market: 'spread', side: `${g.home.abbr} ${g.spread}`, edge_pct: 3.2, kelly_pct: 1.5 }]
      : [],
    summary: g.spread != null ? `Slight model lean on ${g.home.abbr} vs. consensus.` : 'Pricing in line with model.',
  }));
  if (!c) return fallback;
  try {
    const msg = await c.messages.create({
      model: MODEL_BIG,
      max_tokens: 1200,
      system: [{ type: 'text', text: BET_SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
      messages: [{ role: 'user', content: `Compute edges for these games and return JSON array: ${JSON.stringify(games.slice(0, 10))}` }],
    });
    const text = (msg.content[0] as any).text as string;
    return JSON.parse(text);
  } catch { return fallback; }
}

export async function gradeTake(text: string, gameContext?: Game) {
  const c = client();
  const fallback = { grade: 50, rationale: 'Without model context, this take grades as a coin flip.' };
  if (!c) return fallback;
  try {
    const msg = await c.messages.create({
      model: MODEL_SMALL,
      max_tokens: 200,
      system: [{ type: 'text', text: TAKE_SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
      messages: [{ role: 'user', content: `Take: "${text}"\nContext: ${gameContext ? JSON.stringify(gameContext) : 'general NFL'}` }],
    });
    const t = (msg.content[0] as any).text as string;
    return JSON.parse(t);
  } catch { return fallback; }
}

export async function agentMessage(opts: { teams: string[]; tone: 'analyst'|'hype'|'salty'; kind: 'pregame'|'recap'; games: Game[] }) {
  const c = client();
  const fallback = {
    subject: `${opts.kind === 'pregame' ? 'Pre-game' : 'Recap'}: ${opts.teams.join(', ')}`,
    body: `Your ${opts.tone} briefing for ${opts.teams.join(', ')} is ready. Check the dashboard for full Game Pulse.`,
  };
  if (!c) return fallback;
  try {
    const msg = await c.messages.create({
      model: MODEL_SMALL,
      max_tokens: 500,
      system: [{ type: 'text', text: AGENT_SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
      messages: [{ role: 'user', content: `Tone: ${opts.tone}\nKind: ${opts.kind}\nFav teams: ${opts.teams.join(', ')}\nRelevant games: ${JSON.stringify(opts.games.filter(g => opts.teams.some(t => g.home.abbr === t || g.away.abbr === t)))}` }],
    });
    const t = (msg.content[0] as any).text as string;
    return JSON.parse(t);
  } catch { return fallback; }
}

export async function clusterNews(items: { title: string; source: string; url: string }[]) {
  const c = client();
  if (!c) return { clusters: items.map(it => ({ headline: it.title, tag: 'NFL', items: [it] })) };
  try {
    const msg = await c.messages.create({
      model: MODEL_SMALL,
      max_tokens: 800,
      system: [{ type: 'text', text: NEWS_SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
      messages: [{ role: 'user', content: JSON.stringify(items) }],
    });
    const t = (msg.content[0] as any).text as string;
    return JSON.parse(t);
  } catch {
    return { clusters: items.map(it => ({ headline: it.title, tag: 'NFL', items: [it] })) };
  }
}
