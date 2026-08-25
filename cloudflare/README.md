# Cloudflare setup — Infinite Dungeon v6

You already created the Worker and D1 binding manually. Keep them; do not create duplicates.

1. In D1 `infinite-dungeon`, open the SQL console and run `schema.sql` once.
2. In the Worker, keep the D1 binding name exactly `DB` and point it at the existing `infinite-dungeon` database.
3. Add a Worker secret named `ADMIN_SECRET`. Never put its value in GitHub.
4. Deploy `worker.js` to the existing `infinite-dungeon-api` Worker.
5. Test `https://YOUR-WORKER.workers.dev/hall` — it should return `[]` initially.
6. Put the Worker URL into `dungeon/game.js` as `API_URL` (without a trailing slash).
7. Test a death. The browser will submit the fallen expedition to `/expedition` and the global Hall will read `/hall`.

## GitHub automatic deployment

You can connect the existing Worker to this repository through Cloudflare Workers Builds / Git integration. Configure the production branch used by your repo and set the Worker root directory to `cloudflare` if the dashboard asks for a root directory. The Worker source is `cloudflare/worker.js` and the Wrangler config is `cloudflare/wrangler.toml`.

Do not commit API tokens, ADMIN_SECRET values, or `.env` files.

## Admin season reset

POST JSON `{ "name": "Season 2" }` to `/admin/season` with header `x-admin-secret: <secret>`. The Worker archives the current season and creates a new active one. The old expedition rows remain for historical Hall-of-Legends use.
