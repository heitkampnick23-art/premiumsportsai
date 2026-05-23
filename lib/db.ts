import { env } from './env';

// Local-dev fallback: in-memory store so the app runs without D1 bound.
type Row = Record<string, any>;
const mem: Record<string, Row[]> = {
  users: [],
  takes: [],
  take_grades: [],
  predictions: [],
  agent_settings: [],
  agent_messages: [],
  tips: [],
  subscriptions: [],
  daily_locks: [],
  pick_unlocks: [],
  affiliate_clicks: [],
  referrals: [],
  user_streaks: [],
  dfs_lineups: [],
  email_subscribers: [],
  push_subscriptions: [],
  contests: [],
  contest_entries: [],
  chat_usage: [],
};

let memSeeded = false;
function seedMem() {
  if (memSeeded) return;
  memSeeded = true;
  mem.takes.push(
    { id: 'seed-1', user_email: 'demo@premiumsportsai.com', game_id: 'fx-1', text: 'Mahomes throws 4 TDs and the Chiefs cover -3.5 easy.', grade: 72, rationale: 'Likely: KC offense vs. soft secondary; historical TD prop hit rate ~60%.', clout: 14, created_at: Date.now() - 3600_000 },
    { id: 'seed-2', user_email: 'salty@premiumsportsai.com', game_id: 'fx-2', text: 'Cowboys lose by 20. Book it.', grade: 33, rationale: 'Bold: 20+ point losses for DAL hit ~12% of games in trailing season.', clout: 6, created_at: Date.now() - 7200_000 },
  );
}

export function getDB(): D1Database | null {
  const e = env();
  return e.DB ?? null;
}

export type QueryResult<T = Row> = { results: T[] };

export async function q<T = Row>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  const db = getDB();
  if (db) {
    const stmt = db.prepare(sql).bind(...params);
    const r = await stmt.all<T>();
    return { results: (r.results as T[]) ?? [] };
  }
  // Tiny in-memory fallback: only supports the basic ops the app uses.
  seedMem();
  return memFallback<T>(sql, params);
}

export async function exec(sql: string, params: any[] = []) {
  const db = getDB();
  if (db) {
    await db.prepare(sql).bind(...params).run();
    return;
  }
  seedMem();
  memFallback(sql, params);
}

function memFallback<T = Row>(sql: string, params: any[]): QueryResult<T> {
  const s = sql.trim().toLowerCase();
  // SELECT ... FROM <table> [WHERE ...] [ORDER BY ...] [LIMIT n]
  const selMatch = s.match(/^select\s+.*?\s+from\s+(\w+)/);
  if (selMatch) {
    const t = selMatch[1];
    let rows = [...(mem[t] ?? [])];
    // very small WHERE handler: WHERE col = ?
    const whereEq = s.match(/where\s+(\w+)\s*=\s*\?/);
    if (whereEq) {
      const col = whereEq[1];
      const val = params[0];
      rows = rows.filter(r => r[col] === val);
    }
    if (s.includes('order by created_at desc')) rows.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
    if (s.includes('order by clout desc')) rows.sort((a, b) => (b.clout ?? 0) - (a.clout ?? 0));
    const lim = s.match(/limit\s+(\d+)/);
    if (lim) rows = rows.slice(0, parseInt(lim[1]));
    return { results: rows as T[] };
  }
  const insMatch = s.match(/^insert\s+into\s+(\w+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/);
  if (insMatch) {
    const t = insMatch[1];
    const cols = insMatch[2].split(',').map(c => c.trim());
    const row: Row = {};
    cols.forEach((c, i) => (row[c] = params[i]));
    if (!row.id) row.id = crypto.randomUUID();
    if (!row.created_at) row.created_at = Date.now();
    mem[t] = mem[t] ?? [];
    mem[t].push(row);
    return { results: [row as T] };
  }
  const updMatch = s.match(/^update\s+(\w+)\s+set\s+(.+?)\s+where\s+(\w+)\s*=\s*\?/);
  if (updMatch) {
    const t = updMatch[1];
    const sets = updMatch[2].split(',').map(p => p.split('=')[0].trim());
    const whereCol = updMatch[3];
    const whereVal = params[params.length - 1];
    (mem[t] ?? []).forEach(r => {
      if (r[whereCol] === whereVal) sets.forEach((c, i) => (r[c] = params[i]));
    });
    return { results: [] };
  }
  return { results: [] };
}
