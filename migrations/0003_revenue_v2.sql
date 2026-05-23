-- Revenue + retention v2: pools, sponsors, badges, A/B, email funnel, SEO archive metadata
-- Daily Fantasy "Sunday Slate" pools
CREATE TABLE IF NOT EXISTS pools (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,       -- YYYY-MM-DD (Sunday)
  name TEXT NOT NULL,
  entry_fee_cents INTEGER NOT NULL, -- 500, 2500, 10000
  rake_bps INTEGER NOT NULL DEFAULT 1500, -- 15% rake
  status TEXT NOT NULL DEFAULT 'open',    -- 'open' | 'locked' | 'settled'
  prize_pool_cents INTEGER NOT NULL DEFAULT 0,
  winner_email TEXT,
  settled_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pools_week ON pools(week_start);

CREATE TABLE IF NOT EXISTS pool_entries (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  stripe_id TEXT,
  paid INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(pool_id, user_email)
);
CREATE INDEX IF NOT EXISTS idx_pool_entries_pool ON pool_entries(pool_id, score DESC);

CREATE TABLE IF NOT EXISTS pool_picks (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  pick TEXT NOT NULL,             -- 'home'|'away'
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pool_picks_entry ON pool_picks(entry_id);

CREATE TABLE IF NOT EXISTS payouts_pending (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,           -- 'pool_win'|'referral_bounty'
  source_id TEXT,                 -- pool id etc
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'paid'|'cancelled'
  paid_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts_pending(user_email, status);

CREATE TABLE IF NOT EXISTS pool_age_acks (
  user_email TEXT PRIMARY KEY,
  acknowledged_at INTEGER NOT NULL
);

-- Sponsored "Take of the Day"
CREATE TABLE IF NOT EXISTS sponsored_takes (
  id TEXT PRIMARY KEY,
  sponsor_name TEXT NOT NULL,
  sponsor_link TEXT NOT NULL,
  tier TEXT NOT NULL,             -- 'bronze'|'silver'|'gold'
  text TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sponsored_active ON sponsored_takes(starts_at, ends_at);

-- Email funnel queue (welcome drip + reactivation)
CREATE TABLE IF NOT EXISTS email_queue (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,         -- 'welcome_1'|'welcome_2'|'welcome_3'|'reactivation'
  scheduled_for INTEGER NOT NULL,
  sent_at INTEGER,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'sent'|'failed'
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_queue_due ON email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_to ON email_queue(to_email);

CREATE TABLE IF NOT EXISTS email_events (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  campaign TEXT NOT NULL,
  event TEXT NOT NULL,            -- 'click'|'convert'
  url TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign, created_at DESC);

-- User last-seen for reactivation
CREATE TABLE IF NOT EXISTS user_activity (
  user_email TEXT PRIMARY KEY,
  last_seen INTEGER NOT NULL,
  reactivation_sent_at INTEGER
);

-- A/B test bucketing + events
CREATE TABLE IF NOT EXISTS ab_events (
  id TEXT PRIMARY KEY,
  bucket_id TEXT NOT NULL,        -- anonymous cookie id
  variant TEXT NOT NULL,          -- 'A'|'B'
  event TEXT NOT NULL,            -- 'view'|'checkout_start'|'checkout_complete'
  user_email TEXT,
  meta TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ab_variant_event ON ab_events(variant, event, created_at DESC);

-- Push admin send log
CREATE TABLE IF NOT EXISTS push_log (
  id TEXT PRIMARY KEY,
  user_email TEXT,
  endpoint_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  status INTEGER,
  created_at INTEGER NOT NULL
);
