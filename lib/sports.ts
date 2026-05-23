import { env } from './env';
import { fixtureGames, type Game } from '../data/fixtures';

const CACHE_TTL = 60; // seconds

async function fromKV(key: string): Promise<any | null> {
  try {
    const kv = env().CACHE;
    if (!kv) return null;
    const v = await kv.get(key, 'json');
    return v ?? null;
  } catch { return null; }
}
async function toKV(key: string, value: any, ttl = CACHE_TTL) {
  try {
    const kv = env().CACHE;
    if (!kv) return;
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch { /* non-fatal */ }
}

function safeAbbr(name: string): string {
  if (!name || typeof name !== 'string') return 'TM';
  const parts = name.split(' ');
  const last = parts[parts.length - 1] || name;
  return last.slice(0, 3).toUpperCase();
}

export async function listGames(): Promise<Game[]> {
  try {
    const cached = await fromKV('games:nfl:upcoming');
    if (cached && Array.isArray(cached)) return cached;

    const e = env();
    if (e.ODDS_API_KEY) {
      try {
        const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?regions=us&markets=spreads,totals,h2h&oddsFormat=american&apiKey=${e.ODDS_API_KEY}`;
        const r = await fetch(url, { cf: { cacheTtl: 60 } as any });
        if (r.ok) {
          const data: any[] = await r.json();
          const games: Game[] = data.slice(0, 20).map((g, i) => {
            const dk = g.bookmakers?.find((b: any) => b.key === 'draftkings') ?? g.bookmakers?.[0];
            const spreadMkt = dk?.markets?.find((m: any) => m.key === 'spreads');
            const totalMkt = dk?.markets?.find((m: any) => m.key === 'totals');
            const h2hMkt = dk?.markets?.find((m: any) => m.key === 'h2h');
            const homeSpread = spreadMkt?.outcomes?.find((o: any) => o.name === g.home_team)?.point;
            const total = totalMkt?.outcomes?.[0]?.point;
            const mlHome = h2hMkt?.outcomes?.find((o: any) => o.name === g.home_team)?.price;
            const mlAway = h2hMkt?.outcomes?.find((o: any) => o.name === g.away_team)?.price;
            return {
              id: g.id ?? `odds-${i}`,
              starts_at: g.commence_time,
              status: 'scheduled',
              home: { abbr: safeAbbr(g.home_team), name: g.home_team ?? 'Home', record: '' },
              away: { abbr: safeAbbr(g.away_team), name: g.away_team ?? 'Away', record: '' },
              spread: homeSpread,
              total,
              moneyline_home: mlHome,
              moneyline_away: mlAway,
            };
          });
          if (games.length) {
            await toKV('games:nfl:upcoming', games, 60);
            return games;
          }
        }
      } catch { /* fall through to fixtures */ }
    }
    await toKV('games:nfl:upcoming', fixtureGames, 30);
    return fixtureGames;
  } catch {
    return fixtureGames;
  }
}

export async function getGame(id: string): Promise<Game | null> {
  try {
    const all = await listGames();
    return all.find(g => g.id === id) ?? null;
  } catch { return null; }
}
