# Narwhals vs Unicorns — V1

A local 2-player, turn-based, destructible-terrain duel. No backend, no build step — just static files.

## Run it
Open `index.html` directly in a browser, or serve the folder with any static server. To deploy: push this folder to your GitHub repo and let Amplify sync it to your existing domain, exactly like any other static site. Cloudflare isn't needed for V1 — it's only in the picture later if you add a database or Workers for online play/leaderboards.

## Controls
**Player 1 — Narwhal**
- `A` / `D` — move
- `W` / `S` — aim up / down
- `Space` — hold to charge power, release to fire

**Player 2 — Unicorn**
- `←` / `→` — move
- `↑` / `↓` — aim up / down
- `Enter` — hold to charge power, release to fire

Pick a weapon by clicking its button in your panel below the battlefield before firing.

## Touch controls (phones/tablets)
Since two people typically share one device, there's a single on-screen pad (Left/Right, Aim Up/Down, and a hold-to-charge Fire button) rather than two separate touch layouts. It always drives whoever's turn it currently is — pass the phone across the table between turns and the pad just follows.

## Weapons
1. **Tusk Lance** (bazooka) — arcing projectile, affected by wind, big crater. Unlimited ammo.
2. **Horn Blast** (shotgun) — 5-pellet hitscan spread, short range, small craters. Unlimited ammo.
3. **Spiral Bomb** (grenade) — bounces off terrain, explodes on a timer. 5 uses.
4. **Horn Rain** (airstrike) — calls down 4 bombs on the opponent's position, no aiming needed. 2 uses.
5. **Rainbow Warp** (teleport) — charge then release to blink in your aim direction; no damage, pure repositioning. 2 uses.

## How the destructible terrain works
Terrain is drawn once onto an offscreen canvas. Its alpha channel doubles as the collision mask. An explosion erases a circle from that canvas using `globalCompositeOperation = 'destination-out'` — so the crater is both the visual and the physical hole, with no separate terrain data structure to keep in sync.

Each match generates a fresh terrain profile via midpoint displacement, so no two rounds look the same.

## Scoring
Win counts are saved to the browser via `localStorage` (`nvu:stats`). This is per-browser, not shared between players/devices — good enough for a couch-multiplayer V1. Swapping this for a real leaderboard later (Cloudflare Workers + D1/KV) is a drop-in replacement for `js/storage.js` without touching game logic.

## Known V1 limitations / good next steps
- Only one fighter per side (no squads yet).
- No mid-air side-wall collision — combatants can nudge through very steep overhangs.
- Airstrike always targets the opponent's current position rather than a manually-aimed spot.
- No sound.
- The on-screen pad works but isn't laid out for one-handed thumb reach yet — good candidate for a follow-up pass once you've tested it on an actual phone.
