-- Revenue + retention layer
-- Tier tracking is derived from subscriptions.tier ('pro'|'sharp'|null)
ALTER TABLE subscriptions ADD COLUMN tier TEXT;
ALTER TABLE subscriptions ADD COLUMN current_period_end INTEGER;
ALTER TABLE users ADD COLUMN handle TEXT;
ALTER TABLE users ADD COLUMN referral_code TEXT;
ALTER TABLE users ADD COLUMN referred_by TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_refcode ON users(referral_code);

CREATE TABLE IF NOT EXISTS daily_locks (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,            -- YYYY-MM-DD
  slot INTEGER NOT NULL,         -- 1..4 free/pro, 5 = sharp
  tier_required TEXT NOT NULL,   -- 'free' | 'pro' | 'sharp'
  game_id TEXT,
  matchup TEXT NOT NULL,
  pick TEXT NOT NULL,
  market TEXT NOT NULL,          -- 'spread' | 'total' | 'ml'
  confidence INTEGER NOT NULL,
  reasoning TEXT NOT NULL,
  sharp_notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locks_date ON daily_locks(date);

CREATE TABLE IF NOT EXISTS pick_unlocks (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  lock_id TEXT NOT NULL,
  stripe_id TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(user_email, lock_id)
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id TEXT PRIMARY KEY,
  user_email TEXT,
  book TEXT NOT NULL,
  ip_country TEXT,
  ua TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_aff_book ON affiliate_clicks(book, created_at DESC);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_email TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  status TEXT NOT NULL,          -- 'pending' | 'granted'
  granted_at INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE(referee_email)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_email);

CREATE TABLE IF NOT EXISTS user_streaks (
  user_email TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_login_day TEXT,           -- YYYY-MM-DD
  badges TEXT NOT NULL DEFAULT '[]', -- JSON array
  reward_granted_30 INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dfs_lineups (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  site TEXT NOT NULL,            -- 'dk' | 'fd'
  slate TEXT NOT NULL,
  payload TEXT NOT NULL,         -- JSON of 3 lineups
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dfs_user ON dfs_lineups(user_email, created_at DESC);

CREATE TABLE IF NOT EXISTS email_subscribers (
  email TEXT PRIMARY KEY,
  confirmed INTEGER NOT NULL DEFAULT 0,
  confirm_token TEXT,
  unsub_token TEXT,
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_email TEXT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  topics TEXT NOT NULL DEFAULT '[]', -- JSON array: 'pregame','injury','grade'
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_email);

CREATE TABLE IF NOT EXISTS contests (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL UNIQUE, -- YYYY-MM-DD (Sunday)
  slate TEXT NOT NULL,             -- JSON: [{id, home, away, ai_pick}]
  winner_email TEXT,
  reward_granted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS contest_entries (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  picks TEXT NOT NULL,           -- JSON {game_id: 'home'|'away'}
  score INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(contest_id, user_email)
);
CREATE INDEX IF NOT EXISTS idx_entries_contest ON contest_entries(contest_id, score DESC);

CREATE TABLE IF NOT EXISTS chat_usage (
  user_email TEXT NOT NULL,
  day TEXT NOT NULL,             -- YYYY-MM-DD
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_email, day)
);
