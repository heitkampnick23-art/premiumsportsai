CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS takes (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  game_id TEXT,
  text TEXT NOT NULL,
  grade INTEGER NOT NULL,
  rationale TEXT,
  clout INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_takes_created ON takes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_takes_user ON takes(user_email);

CREATE TABLE IF NOT EXISTS take_grades (
  id TEXT PRIMARY KEY,
  take_id TEXT NOT NULL,
  hit INTEGER,
  graded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pred_game ON predictions(game_id);

CREATE TABLE IF NOT EXISTS agent_settings (
  id TEXT PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL,
  teams TEXT,
  tone TEXT DEFAULT 'analyst',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agentmsg_user ON agent_messages(user_email, created_at DESC);

CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  stripe_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL,
  stripe_id TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
