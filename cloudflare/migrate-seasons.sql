-- Infinite Dungeon — Migration: Add Seasons
-- Run with: wrangler d1 execute infinite-dungeon --file=migrate-seasons.sql

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Season 1',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME DEFAULT NULL
);

-- Insert first season if none exists
INSERT OR IGNORE INTO seasons (id, name) VALUES (1, 'Season 1');

-- Add season_id column to existing hall_of_fame table
ALTER TABLE hall_of_fame ADD COLUMN season_id INTEGER NOT NULL DEFAULT 1;

-- Create the index
CREATE INDEX IF NOT EXISTS idx_hof_season_xp ON hall_of_fame(season_id, xp DESC, level DESC, floor DESC, items DESC);
