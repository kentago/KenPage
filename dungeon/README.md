# Infinite Dungeon v6

Static endless dungeon crawler with persistent discovered-room memory, procedural floors, permadeath, dwarf lore identities, rare monster-inspired loot, equipment slots, quests, traders, rest resources, ladders, secret passages, fleeing, and optional Cloudflare D1 global Hall of Fame.

## Repository layout
- `dungeon/` — static site deployed by AWS Amplify.
- `cloudflare/` — Cloudflare Worker + D1 schema/API.

## v6 highlights
- Fight rooms lock movement/search/rest until victory; defeating a foe unlocks search without spoiling it beforehand.
- Every discovered room remembers foes, searched state, blocked edges, ladders, NPCs, traders, rest uses and revealed secrets.
- Blocked compass edges are remembered symmetrically between adjacent rooms.
- Fleeing uses creature-specific consequences; natural 20 is a clean escape.
- Rare loot chance rises after monsters and resets after a rare find; rare items can have unique traits and monster-inspired names.
- 30-item carry limit and persistent equipment; ten ring slots can be permanently lost during a bad flee.
- NPC quests remember target floor and reward; secret-passage quests pay 3× reward.
- Ladders reveal only after the room's foe is defeated; used ladders remain green in memory.
- Traders are green `$` encounters.
- Rest is only available at discovered resting resources and can have multiple uses.
- W/A/S/D keyboard movement; compass UI is arranged as a compass.
- New Run clears the current run log and state.
- Global Hall API is optional until Cloudflare is configured; local Hall remains as a fallback.


## v7 — Visible Ladders & F Shortcut

Rooms without foes may immediately reveal discovered ladders. A room with a living foe still reveals no ladder or other navigational shortcut until victory. F is a contextual shortcut for a discovered ladder, NPC/trader interaction, or valid rest action. W/A/S/D remain movement controls.
