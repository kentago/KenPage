-- Infinite Dungeon — Migration: Add kill stats to Hall of Fame
-- Run with: wrangler d1 execute infinite-dungeon --file=migrate-stats.sql

ALTER TABLE hall_of_fame ADD COLUMN kills INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hall_of_fame ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hall_of_fame ADD COLUMN gold INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hall_of_fame ADD COLUMN actions INTEGER NOT NULL DEFAULT 0;
