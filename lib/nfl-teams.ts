// Static NFL team data. Embedded — no external fetch.
export type NflTeam = {
  slug: string;       // url slug e.g. "kansas-city-chiefs"
  abbr: string;       // KC
  name: string;       // "Kansas City Chiefs"
  city: string;
  mascot: string;
  conference: 'AFC' | 'NFC';
  division: 'East' | 'West' | 'North' | 'South';
  colors: { primary: string; secondary: string };
};

export const NFL_TEAMS: NflTeam[] = [
  // AFC East
  { slug: 'buffalo-bills',         abbr: 'BUF', name: 'Buffalo Bills',         city: 'Buffalo',       mascot: 'Bills',     conference: 'AFC', division: 'East',  colors: { primary: '#00338D', secondary: '#C60C30' } },
  { slug: 'miami-dolphins',        abbr: 'MIA', name: 'Miami Dolphins',        city: 'Miami',         mascot: 'Dolphins',  conference: 'AFC', division: 'East',  colors: { primary: '#008E97', secondary: '#FC4C02' } },
  { slug: 'new-england-patriots',  abbr: 'NE',  name: 'New England Patriots',  city: 'New England',   mascot: 'Patriots',  conference: 'AFC', division: 'East',  colors: { primary: '#002244', secondary: '#C60C30' } },
  { slug: 'new-york-jets',         abbr: 'NYJ', name: 'New York Jets',         city: 'New York',      mascot: 'Jets',      conference: 'AFC', division: 'East',  colors: { primary: '#125740', secondary: '#FFFFFF' } },
  // AFC North
  { slug: 'baltimore-ravens',      abbr: 'BAL', name: 'Baltimore Ravens',      city: 'Baltimore',     mascot: 'Ravens',    conference: 'AFC', division: 'North', colors: { primary: '#241773', secondary: '#9E7C0C' } },
  { slug: 'cincinnati-bengals',    abbr: 'CIN', name: 'Cincinnati Bengals',    city: 'Cincinnati',    mascot: 'Bengals',   conference: 'AFC', division: 'North', colors: { primary: '#FB4F14', secondary: '#000000' } },
  { slug: 'cleveland-browns',      abbr: 'CLE', name: 'Cleveland Browns',      city: 'Cleveland',     mascot: 'Browns',    conference: 'AFC', division: 'North', colors: { primary: '#311D00', secondary: '#FF3C00' } },
  { slug: 'pittsburgh-steelers',   abbr: 'PIT', name: 'Pittsburgh Steelers',   city: 'Pittsburgh',    mascot: 'Steelers',  conference: 'AFC', division: 'North', colors: { primary: '#FFB612', secondary: '#101820' } },
  // AFC South
  { slug: 'houston-texans',        abbr: 'HOU', name: 'Houston Texans',        city: 'Houston',       mascot: 'Texans',    conference: 'AFC', division: 'South', colors: { primary: '#03202F', secondary: '#A71930' } },
  { slug: 'indianapolis-colts',    abbr: 'IND', name: 'Indianapolis Colts',    city: 'Indianapolis',  mascot: 'Colts',     conference: 'AFC', division: 'South', colors: { primary: '#002C5F', secondary: '#A2AAAD' } },
  { slug: 'jacksonville-jaguars',  abbr: 'JAX', name: 'Jacksonville Jaguars',  city: 'Jacksonville',  mascot: 'Jaguars',   conference: 'AFC', division: 'South', colors: { primary: '#101820', secondary: '#D7A22A' } },
  { slug: 'tennessee-titans',      abbr: 'TEN', name: 'Tennessee Titans',      city: 'Tennessee',     mascot: 'Titans',    conference: 'AFC', division: 'South', colors: { primary: '#0C2340', secondary: '#4B92DB' } },
  // AFC West
  { slug: 'denver-broncos',        abbr: 'DEN', name: 'Denver Broncos',        city: 'Denver',        mascot: 'Broncos',   conference: 'AFC', division: 'West',  colors: { primary: '#FB4F14', secondary: '#002244' } },
  { slug: 'kansas-city-chiefs',    abbr: 'KC',  name: 'Kansas City Chiefs',    city: 'Kansas City',   mascot: 'Chiefs',    conference: 'AFC', division: 'West',  colors: { primary: '#E31837', secondary: '#FFB81C' } },
  { slug: 'las-vegas-raiders',     abbr: 'LV',  name: 'Las Vegas Raiders',     city: 'Las Vegas',     mascot: 'Raiders',   conference: 'AFC', division: 'West',  colors: { primary: '#000000', secondary: '#A5ACAF' } },
  { slug: 'los-angeles-chargers',  abbr: 'LAC', name: 'Los Angeles Chargers',  city: 'Los Angeles',   mascot: 'Chargers',  conference: 'AFC', division: 'West',  colors: { primary: '#0080C6', secondary: '#FFC20E' } },
  // NFC East
  { slug: 'dallas-cowboys',        abbr: 'DAL', name: 'Dallas Cowboys',        city: 'Dallas',        mascot: 'Cowboys',   conference: 'NFC', division: 'East',  colors: { primary: '#003594', secondary: '#869397' } },
  { slug: 'new-york-giants',       abbr: 'NYG', name: 'New York Giants',       city: 'New York',      mascot: 'Giants',    conference: 'NFC', division: 'East',  colors: { primary: '#0B2265', secondary: '#A71930' } },
  { slug: 'philadelphia-eagles',   abbr: 'PHI', name: 'Philadelphia Eagles',   city: 'Philadelphia',  mascot: 'Eagles',    conference: 'NFC', division: 'East',  colors: { primary: '#004C54', secondary: '#A5ACAF' } },
  { slug: 'washington-commanders', abbr: 'WAS', name: 'Washington Commanders', city: 'Washington',    mascot: 'Commanders',conference: 'NFC', division: 'East',  colors: { primary: '#5A1414', secondary: '#FFB612' } },
  // NFC North
  { slug: 'chicago-bears',         abbr: 'CHI', name: 'Chicago Bears',         city: 'Chicago',       mascot: 'Bears',     conference: 'NFC', division: 'North', colors: { primary: '#0B162A', secondary: '#C83803' } },
  { slug: 'detroit-lions',         abbr: 'DET', name: 'Detroit Lions',         city: 'Detroit',       mascot: 'Lions',     conference: 'NFC', division: 'North', colors: { primary: '#0076B6', secondary: '#B0B7BC' } },
  { slug: 'green-bay-packers',     abbr: 'GB',  name: 'Green Bay Packers',     city: 'Green Bay',     mascot: 'Packers',   conference: 'NFC', division: 'North', colors: { primary: '#203731', secondary: '#FFB612' } },
  { slug: 'minnesota-vikings',     abbr: 'MIN', name: 'Minnesota Vikings',     city: 'Minnesota',     mascot: 'Vikings',   conference: 'NFC', division: 'North', colors: { primary: '#4F2683', secondary: '#FFC62F' } },
  // NFC South
  { slug: 'atlanta-falcons',       abbr: 'ATL', name: 'Atlanta Falcons',       city: 'Atlanta',       mascot: 'Falcons',   conference: 'NFC', division: 'South', colors: { primary: '#A71930', secondary: '#000000' } },
  { slug: 'carolina-panthers',     abbr: 'CAR', name: 'Carolina Panthers',     city: 'Carolina',      mascot: 'Panthers',  conference: 'NFC', division: 'South', colors: { primary: '#0085CA', secondary: '#101820' } },
  { slug: 'new-orleans-saints',    abbr: 'NO',  name: 'New Orleans Saints',    city: 'New Orleans',   mascot: 'Saints',    conference: 'NFC', division: 'South', colors: { primary: '#D3BC8D', secondary: '#101820' } },
  { slug: 'tampa-bay-buccaneers',  abbr: 'TB',  name: 'Tampa Bay Buccaneers',  city: 'Tampa Bay',     mascot: 'Buccaneers',conference: 'NFC', division: 'South', colors: { primary: '#D50A0A', secondary: '#0A0A08' } },
  // NFC West
  { slug: 'arizona-cardinals',     abbr: 'ARI', name: 'Arizona Cardinals',     city: 'Arizona',       mascot: 'Cardinals', conference: 'NFC', division: 'West',  colors: { primary: '#97233F', secondary: '#000000' } },
  { slug: 'los-angeles-rams',      abbr: 'LAR', name: 'Los Angeles Rams',      city: 'Los Angeles',   mascot: 'Rams',      conference: 'NFC', division: 'West',  colors: { primary: '#003594', secondary: '#FFA300' } },
  { slug: 'san-francisco-49ers',   abbr: 'SF',  name: 'San Francisco 49ers',   city: 'San Francisco', mascot: '49ers',     conference: 'NFC', division: 'West',  colors: { primary: '#AA0000', secondary: '#B3995D' } },
  { slug: 'seattle-seahawks',      abbr: 'SEA', name: 'Seattle Seahawks',      city: 'Seattle',       mascot: 'Seahawks',  conference: 'NFC', division: 'West',  colors: { primary: '#002244', secondary: '#69BE28' } },
];

export function teamBySlug(slug: string): NflTeam | null {
  return NFL_TEAMS.find((t) => t.slug === slug) ?? null;
}
export function teamByName(name: string): NflTeam | null {
  const n = name.toLowerCase();
  return NFL_TEAMS.find((t) => t.name.toLowerCase() === n || t.mascot.toLowerCase() === n || t.abbr.toLowerCase() === n) ?? null;
}
export function teamByAbbr(abbr: string): NflTeam | null {
  const a = abbr.toUpperCase();
  return NFL_TEAMS.find((t) => t.abbr === a) ?? null;
}
