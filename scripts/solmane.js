async function fetchSolManeTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

// Beräknar månfas lokalt, ingen nätverksåtkomst behövs. Baserat på en känd
// nymåne (2000-01-06 18:14 UTC) och månens synodiska cykel (~29.53 dygn).
// Noggrannhet: inom ±1 dygn, fullt tillräckligt för en kiosk-vy.
function moonPhase(date) {
  const synodicMonth = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const diffDays = (date.getTime() - knownNewMoon) / 86400000;
  const age = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  const index = Math.floor((age / synodicMonth) * 8 + 0.5) % 8;
  const names = ['Nymåne', 'Tilltagande månskära', 'Första kvarteret', 'Tilltagande måne', 'Fullmåne', 'Avtagande måne', 'Sista kvarteret', 'Avtagande månskära'];
  const emojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  return { name: names[index], emoji: emojis[index], age };
}

function formatClock(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

async function solMane() {
  const el = document.getElementById('solmaneContent');
  const c = coordsForStationName(stations.from?.name, COORDS.kungsbacka);
  const moon = moonPhase(new Date());

  let sunriseStr = '—';
  let sunsetStr = '—';
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=sunrise,sunset&timezone=Europe/Stockholm&forecast_days=1`;
    const d = await fetchSolManeTimeout(url);
    sunriseStr = formatClock(d.daily?.sunrise?.[0]);
    sunsetStr = formatClock(d.daily?.sunset?.[0]);
  } catch (e) {
    // Solens tider kunde inte hämtas — visa ändå månfasen, som inte behöver nätverket.
  }

  el.innerHTML = `
    <div class="solmane-row">
      <div class="solmane-card">
        <div class="solmane-icon">🌅</div>
        <div class="solmane-label">Soluppgång</div>
        <div class="solmane-val">${sunriseStr}</div>
      </div>
      <div class="solmane-card">
        <div class="solmane-icon">🌇</div>
        <div class="solmane-label">Solnedgång</div>
        <div class="solmane-val">${sunsetStr}</div>
      </div>
      <div class="solmane-card">
        <div class="solmane-icon">${moon.emoji}</div>
        <div class="solmane-label">Månfas</div>
        <div class="solmane-val">${moon.name}</div>
      </div>
    </div>`;
}

window.addEventListener('dashboard:refresh-weather', solMane);

solMane();
setInterval(solMane, 1800000);

addReloadButton('solmane', '#solmaneWrap');
addHideButton('solmane', '#solmaneWrap', 'solmane');
addMoveButtons('solmane', '#solmaneWrap');
