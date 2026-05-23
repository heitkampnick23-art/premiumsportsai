// Fallback NFL fixtures so the app runs without paid data API keys.
// Real keys (ODDS_API_KEY, SPORTSDATAIO_KEY) take precedence at runtime.

export type Team = { abbr: string; name: string; record: string };
export type Game = {
  id: string;
  starts_at: string; // ISO
  status: 'scheduled' | 'live' | 'final';
  home: Team;
  away: Team;
  home_score?: number;
  away_score?: number;
  quarter?: string;
  spread?: number;        // home spread (negative = home favored)
  total?: number;
  moneyline_home?: number;
  moneyline_away?: number;
  injuries?: { team: string; name: string; pos: string; status: string }[];
};

const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const agoHours = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const fixtureGames: Game[] = [
  {
    id: 'fx-1',
    starts_at: inHours(3),
    status: 'scheduled',
    home: { abbr: 'KC', name: 'Kansas City Chiefs', record: '11-2' },
    away: { abbr: 'BUF', name: 'Buffalo Bills', record: '10-3' },
    spread: -2.5, total: 47.5, moneyline_home: -135, moneyline_away: +115,
    injuries: [
      { team: 'KC', name: 'Isiah Pacheco', pos: 'RB', status: 'Questionable' },
      { team: 'BUF', name: 'Stefon Diggs', pos: 'WR', status: 'Probable' },
    ],
  },
  {
    id: 'fx-2',
    starts_at: inHours(6),
    status: 'scheduled',
    home: { abbr: 'PHI', name: 'Philadelphia Eagles', record: '10-3' },
    away: { abbr: 'DAL', name: 'Dallas Cowboys', record: '7-6' },
    spread: -6.5, total: 49.5, moneyline_home: -290, moneyline_away: +235,
    injuries: [{ team: 'DAL', name: 'Dak Prescott', pos: 'QB', status: 'Out' }],
  },
  {
    id: 'fx-3',
    starts_at: agoHours(1),
    status: 'live',
    home: { abbr: 'SF', name: 'San Francisco 49ers', record: '9-4' },
    away: { abbr: 'SEA', name: 'Seattle Seahawks', record: '6-7' },
    home_score: 17, away_score: 10, quarter: 'Q3 04:22',
    spread: -7, total: 44.5,
  },
  {
    id: 'fx-4',
    starts_at: inHours(28),
    status: 'scheduled',
    home: { abbr: 'BAL', name: 'Baltimore Ravens', record: '10-3' },
    away: { abbr: 'GB', name: 'Green Bay Packers', record: '8-5' },
    spread: -4, total: 46.5, moneyline_home: -200, moneyline_away: +170,
  },
  {
    id: 'fx-5',
    starts_at: agoHours(20),
    status: 'final',
    home: { abbr: 'MIA', name: 'Miami Dolphins', record: '8-5' },
    away: { abbr: 'NYJ', name: 'New York Jets', record: '4-9' },
    home_score: 27, away_score: 13,
    spread: -6, total: 41.5,
  },
];

export const fixtureNews = [
  { id: 'n1', source: 'ESPN', title: 'Chiefs activate RB ahead of primetime Bills clash', url: '#', summary: 'Pacheco trending toward active status after limited Friday practice.', tag: 'NFL', ts: agoHours(2) },
  { id: 'n2', source: 'The Athletic', title: 'How AI is reshaping NFL play-calling', url: '#', summary: 'Coaches lean on AI-assisted prep to compress film study.', tag: 'AI', ts: agoHours(5) },
  { id: 'n3', source: 'PFF', title: 'EPA leaders heading into Week 15', url: '#', summary: 'Mahomes, Lamar, Allen lead expected points added per dropback.', tag: 'NFL', ts: agoHours(7) },
  { id: 'n4', source: 'Wired', title: 'The new wave of sportsbook models', url: '#', summary: 'Books are deploying transformer-based pricing across markets.', tag: 'AI', ts: agoHours(12) },
];
