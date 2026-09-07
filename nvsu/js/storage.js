// Simple localStorage wrapper for saving match results.
// V1: no backend, no cookies needed — everything lives in the browser.
const NVU_STORAGE_KEY = 'nvu:stats';

function loadStats() {
  try {
    const raw = localStorage.getItem(NVU_STORAGE_KEY);
    if (!raw) return { p1Wins: 0, p2Wins: 0, matchesPlayed: 0 };
    const parsed = JSON.parse(raw);
    return {
      p1Wins: parsed.p1Wins || 0,
      p2Wins: parsed.p2Wins || 0,
      matchesPlayed: parsed.matchesPlayed || 0,
    };
  } catch (e) {
    console.warn('Could not read stats from localStorage', e);
    return { p1Wins: 0, p2Wins: 0, matchesPlayed: 0 };
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(NVU_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Could not save stats to localStorage', e);
  }
}

function recordWin(winnerKey) {
  const stats = loadStats();
  stats.matchesPlayed += 1;
  if (winnerKey === 'p1') stats.p1Wins += 1;
  if (winnerKey === 'p2') stats.p2Wins += 1;
  saveStats(stats);
  return stats;
}
