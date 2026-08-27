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
          `SELECT id, name, nickname, xp, level, floor, items, country, created_at
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

        const { name, nickname, xp, level, floor, items, country } = body;
        if (!name || xp === undefined || level === undefined || floor === undefined) {
          return json({ ok: false, error: "Missing required fields: name, xp, level, floor" }, 400);
        }

        const season = await getCurrentSeason(env);
        const id = crypto.randomUUID();

        await env.DB.prepare(
          `INSERT INTO hall_of_fame (id, season_id, name, nickname, xp, level, floor, items, country)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          season.id,
          name,
          nickname || "Secret Hero",
          Math.max(0, parseInt(xp) || 0),
          Math.max(1, parseInt(level) || 1),
          Math.max(1, parseInt(floor) || 1),
          Math.max(0, parseInt(items) || 0),
          country || null
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
