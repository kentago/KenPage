const ELZONES = {
    luleå: 'SE1', piteå: 'SE1', kiruna: 'SE1',
    umeå: 'SE2', skellefteå: 'SE2', sundsvall: 'SE2', härnösand: 'SE2',
    gävle: 'SE2', sandviken: 'SE2', falun: 'SE2', borlänge: 'SE2', mora: 'SE2',
    malmö: 'SE4', lund: 'SE4', helsingborg: 'SE4', kristianstad: 'SE4', hässleholm: 'SE4', ystad: 'SE4',
    kungsbacka: 'SE4', varberg: 'SE4', falkenberg: 'SE4', halmstad: 'SE4', laholm: 'SE4', anneberg: 'SE4'
  };

  function getElZone() {
    if (cfg.elZone) return cfg.elZone;
    if (stations.from) {
      const n = stations.from.name.toLowerCase();
      for (const [k, z] of Object.entries(ELZONES)) {
        if (n.includes(k)) return z;
      }
    }
    return 'SE4'; // default: Kungsbacka = SE4
  }

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

  async function elpris() {
    const el = document.getElementById('elprisContent');
    const zone = getElZone();
    const zoneLabel = zone + (cfg.elZone ? ' (manuellt)' : '');

    const now = new Date();
    const dateStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    try {
      const data = await fetchWithTimeout(`https://www.elprisetjustnu.se/api/v1/prices/${dateStr}_${zone}.json`);
      if (!data.length) { el.innerHTML = `<span class="empty">Inga priser</span><span class="elpris-zone">${zoneLabel}</span>`; return; }

      const prices = data.map(d => d.SEK_per_kWh);
      const mn = Math.min(...prices);
      const mx = Math.max(...prices);

      // Find the price bucket covering right now.
      let currentPrice = null;
      let currentIdx = -1;
      for (let i = 0; i < data.length; i++) {
        const s = new Date(data[i].time_start);
        const e = new Date(data[i].time_end);
        if (now >= s && now < e) { currentPrice = data[i].SEK_per_kWh; currentIdx = i; break; }
      }
      if (currentPrice === null) {
        currentPrice = prices[prices.length - 1];
        currentIdx = prices.length - 1;
      }

      // Mini bar chart, sampled hourly (every 4th 15-min bucket).
      const hourly = [];
      for (let i = 0; i < data.length; i += 4) hourly.push({ price: data[i].SEK_per_kWh, idx: i });
      const hMin = Math.min(...hourly.map(h => h.price));
      const hMax = Math.max(...hourly.map(h => h.price));
      const bars = hourly.map(h => {
        const pct = hMax > hMin ? ((h.price - hMin) / (hMax - hMin) * 100) : 50;
        const isCurrent = currentIdx >= h.idx && currentIdx < h.idx + 4;
        const cls = isCurrent ? 'now' : h.price === hMax ? 'hi' : h.price === hMin ? 'lo' : '';
        return `<span style="height:${Math.max(4, pct)}%" class="${cls}"></span>`;
      }).join('');

      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      el.innerHTML = `
        <div class="elpris-now">
          <span class="elpris-val">${currentPrice.toFixed(2)}</span>
          <span class="elpris-unit">kr/kWh</span>
          <span class="elpris-lbl">just nu</span>
        </div>
        <div class="elpris-range">↓ ${mn.toFixed(2)} · snitt ${avg.toFixed(2)} · ↑ ${mx.toFixed(2)} kr/kWh</div>
        <div class="elpris-bar">${bars}</div>
        <span class="elpris-zone">${zoneLabel}</span>`;
    } catch (e) {
      el.innerHTML = `<span class="empty">Kunde ej hämta elpris</span><span class="elpris-zone">${zoneLabel}</span>`;
    }
  }

  // Låt skalet (eller andra moduler) be oss uppdatera utan att känna till funktionsnamnet.
  window.addEventListener('dashboard:refresh-elpris', elpris);

  elpris();
  setInterval(elpris, 15 * 60000);

addReloadButton('elpris', '#elprisWrap');
addHideButton('elpris', '#elprisWrap', 'elpris');
addMoveButtons('elpris', '#elprisWrap');
