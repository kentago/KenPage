# Infinite Dungeon v9 Cloudflare
Keep the existing `infinite-dungeon-api` Worker, D1 database and binding `DB`.

1. Run `schema.sql` against the existing D1 database. If it already has the v8 `expeditions` table, add the v9 columns with:
`ALTER TABLE expeditions ADD COLUMN nickname TEXT NOT NULL DEFAULT 'Secret Hero';`
`ALTER TABLE expeditions ADD COLUMN show_country INTEGER NOT NULL DEFAULT 0;`
`ALTER TABLE expeditions ADD COLUMN country TEXT;`
2. Deploy `worker.js` to `infinite-dungeon-api`.
3. Keep Worker secret `ADMIN_SECRET`; never commit it.
4. `wrangler.toml` expects the D1 UUID as `database_id`, not the database name.
5. Git/Workers Builds may use `cloudflare` as root directory.
