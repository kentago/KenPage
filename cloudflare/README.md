# Infinite Dungeon v8

Git repository structure: `dungeon/` is the AWS Amplify static site; `cloudflare/` is the Cloudflare Worker/D1 side.

v8 adds randomized lore-driven expedition openings, dwarf identity, expedition IDs, different motives/discoveries/beliefs, safe starting chamber, depth-weighted encounters, persistent room state, ladders independent of encounters, flee mechanics, rare monster-inspired loot, W/A/S/D and F shortcuts, and global Hall API scaffolding.

## Cloudflare
Keep the existing Worker `infinite-dungeon-api`, existing D1 `infinite-dungeon`, and binding `DB`. Run `cloudflare/schema.sql` once. Add Worker secret `ADMIN_SECRET`. For Git integration, use `cloudflare` as the Worker root directory. `database_id` in wrangler.toml is the D1 UUID, not the database name. Never commit ADMIN_SECRET.
