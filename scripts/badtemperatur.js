const HAV_BASE = 'https://gw.havochvatten.se/external-public/bathing-waters/v2';
  let bathCache = null;
  let bathFcCache = null;

  async function fetchWithTimeout(url, timeoutMs = 8000) {
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

  async function bathTemp() {
    const el = document.getElementById('bathItems');
    const c = cfg.bathLocation && COORDS[cfg.bathLocation]
      ? COORDS[cfg.bathLocation]
      : coordsForStationName(stations.from?.name, COORDS.kungsbacka);

    try {
      // Fetch all bathing waters + all forecasts (cached for the session)
      if (!bathCache) {
        const allData = await fetchWithTimeout(HAV_BASE + '/bathing-waters');
        bathCache = allData.watersAndAdvisories || [];
      }
      if (!bathFcCache) {
        try {
          const fcData = await fetchWithTimeout(HAV_BASE + '/forecasts');
          bathFcCache = {};
          for (const f of fcData.forecasts || []) bathFcCache[f.bathingWaterId] = f.waterForecasts || [];
        } catch (e) {
          bathFcCache = {};
        }
      }

      // Score every bathing water by distance from the reference point,
      // keeping only ones that actually have a forecast.
      const now = new Date().getHours();
      const scored = [];
      for (const w of bathCache) {
        const bw = w.bathingWater;
        const pos = bw.samplingPointPosition;
        if (!pos) continue;
        const lat = parseFloat(pos.latitude);
        const lon = parseFloat(pos.longitude);
        if (!lat || !lon) continue;
        const fc = bathFcCache[bw.id];
        if (!fc || !fc.length) continue; // no forecast available — skip

        // Find the forecast entry closest to the current hour.
        let best = fc[0];
        let bestDiff = 99;
        for (const f of fc) {
          const diff = Math.abs(parseInt(f.measHour) - now);
          if (diff < bestDiff) { bestDiff = diff; best = f; }
        }
        const d = Math.sqrt((lat - c.lat) ** 2 + (lon - c.lon) ** 2);
        scored.push({ d, name: bw.name, temp: best.waterTemp, advise: w.adviceAgainstBathing || [] });
      }
      scored.sort((a, b) => a.d - b.d);
      const top3 = scored.slice(0, 3);

      if (!top3.length) {
        el.innerHTML = '<span class="empty">Ingen badtemp tillgänglig</span>';
        return;
      }
      el.innerHTML = top3.map(f => {
        const hasWarn = f.advise.length > 0;
        return `<div class="bath-item">
          <div class="bath-name" title="${f.name}">${f.name}</div>
          <div class="bath-temp">${f.temp}<span class="unit">°C</span></div>
          ${hasWarn ? '<div class="bath-warn">⚠ Avrådan</div>' : ''}
        </div>`;
      }).join('');
    } catch (e) {
      el.innerHTML = '<span class="empty">Kunde ej hämta badtemp</span>';
    }
  }

  // Låt skalet (eller andra moduler) be oss uppdatera utan att känna till funktionsnamnet.
  window.addEventListener('dashboard:refresh-bath', bathTemp);

  bathTemp();
  setInterval(bathTemp, 3600000);

addReloadButton('badtemperatur', '#bathWrap');
addHideButton('badtemperatur', '#bathWrap', 'bath');
addMoveButtons('badtemperatur', '#bathWrap');
