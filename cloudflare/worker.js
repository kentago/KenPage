/**
 * Infinite Dungeon — Global Hall of Fame API
 * Cloudflare Worker + D1
 *
 * Endpoints:
 *   GET  /leaderboard              → Top 10 of CURRENT season
 *   GET  /leaderboard?season=3     → Top 10 of a specific past season
 *   GET  /seasons                  → List all seasons (id, name, start/end dates)
 *   GET  /season                   → Current season info
 *   POST /submit                   → Submit a completed expedition (current season)
 *   POST /admin/new-season         → Archive current season, start a new one (requires ADMIN_SECRET)
 *
 * CORS: allows all origins (static game hosted on Amplify)
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // --- GET /season → current season info ---
      if (path === "/season" && request.method === "GET") {
        const season = await getCurrentSeason(env);
        return json({ ok: true, season });
      }

      // --- GET /seasons → list all seasons ---
      if (path === "/seasons" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          `SELECT id, name, started_at, ended_at FROM seasons ORDER BY id DESC`
        ).all();
        return json({ ok: true, seasons: results });
      }

      // --- GET /leaderboard → top 10 (optional ?season=N for past seasons) ---
      if (path === "/leaderboard" && request.method === "GET") {
        const seasonParam = url.searchParams.get("season");
        let seasonId;

        if (seasonParam) {
          seasonId = parseInt(seasonParam);
        } else {
          const current = await getCurrentSeason(env);
          seasonId = current.id;
        }

        const { results } = await env.DB.prepare(
          `SELECT id, name, nickname, xp, level, floor, items, country, kills, best_streak as bestStreak, gold, created_at
           FROM hall_of_fame
           WHERE season_id = ?
           ORDER BY xp DESC, level DESC, floor DESC, items DESC
           LIMIT 10`
        ).bind(seasonId).all();

        // Get season info
        const { results: seasonInfo } = await env.DB.prepare(
          `SELECT id, name, started_at, ended_at FROM seasons WHERE id = ?`
        ).bind(seasonId).all();

        return json({ ok: true, season: seasonInfo[0] || null, leaderboard: results });
      }

      // --- POST /submit → submit to current season ---
      if (path === "/submit" && request.method === "POST") {
        const body = await request.json();

        const { name, nickname, xp, level, floor, items, country, kills, bestStreak, gold, actions } = body;
        if (!name || xp === undefined || level === undefined || floor === undefined) {
          return json({ ok: false, error: "Missing required fields: name, xp, level, floor" }, 400);
        }

        // --- ANTI-CHEAT SANITY CHECKS ---
        // Very generous bounds — only reject physically impossible garbage.
        // A legit deep endless-dungeon run must NEVER be rejected.
        const nXp = Math.max(0, parseInt(xp) || 0);
        const nLevel = Math.max(1, parseInt(level) || 1);
        const nFloor = Math.max(1, parseInt(floor) || 1);
        const nItems = Math.max(0, parseInt(items) || 0);
        const nKills = Math.max(0, parseInt(kills) || 0);
        const nStreak = Math.max(0, parseInt(bestStreak) || 0);
        const nGold = Math.max(0, parseInt(gold) || 0);
        const nActions = Math.max(0, parseInt(actions) || 0);

        // Hard absolute ceilings (absurdly high — no human reaches these)
        if (nXp > 1e12) return json({ ok: false, error: "Rejected: implausible XP" }, 400);
        if (nLevel > 100000) return json({ ok: false, error: "Rejected: implausible level" }, 400);
        if (nFloor > 1000000) return json({ ok: false, error: "Rejected: implausible floor" }, 400);
        if (nItems > 100) return json({ ok: false, error: "Rejected: too many items (max ~48 possible)" }, 400);
        if (nKills > 1e9) return json({ ok: false, error: "Rejected: implausible kills" }, 400);
        if (nStreak > nKills) return json({ ok: false, error: "Rejected: streak cannot exceed total kills" }, 400);
        if (nGold > 1e12) return json({ ok: false, error: "Rejected: implausible gold" }, 400);
        // Name/nickname length guards
        if (String(name).length > 60) return json({ ok: false, error: "Rejected: name too long" }, 400);
        if (nickname && String(nickname).length > 30) return json({ ok: false, error: "Rejected: nickname too long" }, 400);

        // Note: We deliberately do NOT enforce floor/level/XP ratios.
        // The endless dungeon's randomness (lucky crits, boss XP, quest chains,
        // kill-streak multipliers, legendary finds) can produce wildly varied
        // but legitimate numbers. Only impossible garbage is blocked.

        const season = await getCurrentSeason(env);
        const id = crypto.randomUUID();

        await env.DB.prepare(
          `INSERT INTO hall_of_fame (id, season_id, name, nickname, xp, level, floor, items, country, kills, best_streak, gold, actions)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          season.id,
          String(name).slice(0, 60),
          (nickname ? String(nickname).slice(0, 30) : "Secret Hero"),
          nXp,
          nLevel,
          nFloor,
          nItems,
          country ? String(country).slice(0, 2).toUpperCase() : null,
          nKills,
          nStreak,
          nGold,
          nActions
        ).run();

        return json({ ok: true, id, season_id: season.id });
      }

      // --- POST /admin/new-season → archive current, start new ---
      if (path === "/admin/new-season" && request.method === "POST") {
        const secret = request.headers.get("X-Admin-Secret");
        if (!secret || secret !== env.ADMIN_SECRET) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }

        const body = await request.json().catch(() => ({}));
        const seasonName = body.name || null;

        // End current season
        const current = await getCurrentSeason(env);
        await env.DB.prepare(
          `UPDATE seasons SET ended_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(current.id).run();

        // Create new season
        const newName = seasonName || `Season ${current.id + 1}`;
        await env.DB.prepare(
          `INSERT INTO seasons (name) VALUES (?)`
        ).bind(newName).run();

        // Get the new season
        const newSeason = await getCurrentSeason(env);

        return json({ ok: true, message: `New season started: ${newName}`, previous_season: current.id, new_season: newSeason });
      }

      // --- Fallback ---
      return json({ ok: true, service: "infinite-dungeon-api", path });

    } catch (err) {
      return json({ ok: false, error: err.message }, 500);
    }
  },
};

// Helper: get current (active) season
async function getCurrentSeason(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, started_at, ended_at FROM seasons WHERE ended_at IS NULL ORDER BY id DESC LIMIT 1`
  ).all();

  if (results.length > 0) return results[0];

  // No season exists — create the first one
  await env.DB.prepare(`INSERT INTO seasons (name) VALUES ('Season 1')`).run();
  const { results: created } = await env.DB.prepare(
    `SELECT id, name, started_at, ended_at FROM seasons WHERE ended_at IS NULL ORDER BY id DESC LIMIT 1`
  ).all();
  return created[0];
}
