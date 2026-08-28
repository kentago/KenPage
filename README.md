# Infinite Dungeon — Version 1-beta

An endless, replayable roguelike dungeon crawler. Play a Dwarf expedition hero descending through infinite procedurally-generated floors. Permanent death. Global Hall of Fame competition across seasons.

## How to Play

- **Move**: WASD or Arrow keys (compass navigation)
- **E** Search · **T** Talk to NPC/Trader · **F** Fight · **R** Flee
- Explore each floor, fight enemies, complete quests, collect gear, then descend via ladders.
- Danger grows faster than loot — clear a floor to get stronger before going deeper.
- Death is permanent. Your run is submitted to the global Hall of Fame.

## Core Systems

- **Infinite dungeon** with persistent room/floor memory and reciprocal wall blocking
- **Grid map** with symbols for player, enemies, NPCs, traders, ladders, fountains, secrets
- **Combat** — d20 system, crits, kill streaks (up to 3× XP), boss fights every 5th floor
- **Stats** — STR (damage), DEX (dodge/flee/traps), INT (search/secrets), CHA (prices/XP/defense), Luck (rewards)
- **Level-up** — allocate 3-4 stat points freely each level
- **Rings & fingers** — 10 ring slots across two hands; fingers can be permanently lost
- **Loot** — rarity + depth borders, individual rolls, 118-element periodic prefixes for uniqueness
- **Quests** — floor-targeted item hunts with scaling rewards
- **Traders & fountains** — sell items, heal, or gain Luck (with corruption risk)
- **Starter ring choice** — pick 1 of 3 heirloom rings at run start
- **Global Hall of Fame** — Cloudflare D1-backed, seasonal, worldwide top 10

## Architecture

```
Static game (AWS Amplify ← GitHub)
        │
        └─ calls → Cloudflare Worker → D1 (Hall of Fame only)
```

The game is fully playable offline/locally — Cloudflare/D1 is only for the shared global Hall of Fame.

## Files (this folder)

```
index.html        Entry point + game instructions
style.css         All styling
data.js           Constants: names, arts, traits, enemy pools, prefixes
items.js          Item generation, equip/inventory logic
combat.js         Combat, bosses, damage, fingers
npcs.js           NPC quests, level-up
traders.js        Trader system
fountains.js      Rest/Luck fountains
map.js            Grid map rendering
hall.js           Hall of Fame + seasons + country flags
game.js           Core: state, movement, search, render, input, share
```

Script load order (in `index.html`): data → items → combat → npcs → traders → fountains → map → hall → game.

The Cloudflare Worker + D1 API and the full design spec (`DUNGEON_SKILL.MD`) live in the parent project folder.

## Deployment

Push this `dungeon/` folder via GitHub → AWS Amplify. The game is a pure static site (no build step).

## Global Hall of Fame API

Worker URL: `https://bitter-tree-d030.kesj04.workers.dev`

- `GET /leaderboard` — top 10 current season (`?season=N` for past seasons)
- `GET /seasons` — list all seasons
- `POST /submit` — submit a run (auto-tagged to current season)
- `POST /admin/new-season` — archive current + start new (requires `X-Admin-Secret`)

The game submits on death or when giving up a qualifying run. Falls back to localStorage if the API is unreachable.
