CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  ml INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_feeds_date ON feeds(date);
CREATE INDEX IF NOT EXISTS idx_feeds_updated_at ON feeds(updated_at);
CREATE INDEX IF NOT EXISTS idx_feeds_deleted ON feeds(deleted);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
