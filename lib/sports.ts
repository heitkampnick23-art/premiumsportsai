import { env } from './env';
import { fixtureGames, type Game } from '../data/fixtures';

const CACHE_TTL = 60; // seconds

async function fromKV(key: string): Promise<any | null> {
  const kv = env().CACHE;
  if (!kv) return null;
  const v = await kv.get(key, 'json');
  return v ?? null;
}
async function toKV(key: string, value: any, ttl = CACHE_TTL) {
  const kv = env().CACHE;
  if (!kv) return;
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
}

export async function listGames(): Promise<Game[]> {
  const cached = await fromKV('games:nfl:upcoming');
  if (cached) return cached;

  const e = env();
  // Try The Odds API first
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
            home: { abbr: g.home_team.split(' ').pop().slice(0, 3).toUpperCase(), name: g.home_team, record: '' },
            away: { abbr: g.away_team.split(' ').pop().slice(0, 3).toUpperCase(), name: g.away_team, record: '' },
            spread: homeSpread,
            total,
            moneyline_home: mlHome,
            moneyline_away: mlAway,
          };
        });
        await toKV('games:nfl:upcoming', games, 60);
        return games;
      }
    } catch (e) { /* fall through to fixtures */ }
  }
  await toKV('games:nfl:upcoming', fixtureGames, 30);
  return fixtureGames;
}

export async function getGame(id: string): Promise<Game | null> {
  const all = await listGames();
  return all.find(g => g.id === id) ?? null;
}
