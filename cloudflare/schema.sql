-- Infinite Dungeon — Hall of Fame D1 Schema (with Seasons)
-- Run with: wrangler d1 execute infinite-dungeon --file=schema.sql

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Season 1',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME DEFAULT NULL
);

-- Hall of Fame entries (linked to a season)
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id TEXT PRIMARY KEY,
  season_id INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  nickname TEXT DEFAULT 'Secret Hero',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  floor INTEGER NOT NULL DEFAULT 1,
  items INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id)
);

-- Index for leaderboard queries per season
CREATE INDEX IF NOT EXISTS idx_hof_season_xp ON hall_of_fame(season_id, xp DESC, level DESC, floor DESC, items DESC);

-- Insert first season if none exists
INSERT OR IGNORE INTO seasons (id, name) VALUES (1, 'Season 1');
