const WMO = {
    0: '☀️ Klart', 1: '🌤️ Mest klart', 2: '⛅ Växlande', 3: '☁️ Mulet', 45: '🌫️ Dimma',
    51: '🌦️ Duggregn', 61: '🌧️ Regn', 63: '🌧️ Regn', 65: '🌧️ Kraftigt regn',
    71: '🌨️ Snö', 73: '🌨️ Snö', 80: '🌦️ Skurar', 95: '⛈️ Åska'
  };

  async function fetchWithTimeout(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: controller.signal });
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function weather() {
    const c = coordsForStationName(stations.from?.name, COORDS.kungsbacka);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/Stockholm&forecast_days=3`;
      const d = await fetchWithTimeout(url);
      const lbl = ['Idag', 'Imorgon', 'Övermorgon'];
      document.getElementById('weather').innerHTML = d.daily.time.map((t, i) => {
        const w = WMO[d.daily.weathercode[i]] || '❓ Okänt';
        const [ico, dsc] = w.split(' ');
        return `<div class="weather-day">
          <div class="weather-lbl">${lbl[i]}</div>
          <div class="weather-ico">${ico}</div>
          <div class="weather-tmp">${Math.round(d.daily.temperature_2m_max[i])}°<span class="lo">${Math.round(d.daily.temperature_2m_min[i])}°</span></div>
          <div class="weather-dsc">${dsc || ''}</div>
        </div>`;
      }).join('');
    } catch (e) {
      document.getElementById('weather').innerHTML = '<div class="empty">Väder ej tillgängligt</div>';
    }
  }

  // --- Work info: regnkoll för samma ort som väderprognosen, fönster 07–18 ---
  const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

  async function checkTownRain(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,precipitation,weathercode&timezone=Europe/Stockholm&forecast_days=1`;
    const d = await fetchWithTimeout(url);
    const h = d.hourly;
    let maxProb = 0;
    let anyRainCode = false;
    for (let i = 0; i < h.time.length; i++) {
      const hour = parseInt(h.time[i].slice(11, 13), 10);
      if (hour < 7 || hour > 18) continue;
      const prob = h.precipitation_probability?.[i] ?? 0;
      const precip = h.precipitation?.[i] ?? 0;
      const code = h.weathercode?.[i];
      if (prob > maxProb) maxProb = prob;
      if (precip > 0.1 || RAIN_CODES.has(code)) anyRainCode = true;
    }
    return { rain: anyRainCode || maxProb >= 40, maxProb };
  }

  async function workInfo() {
    const el = document.getElementById('workinfoContent');
    const c = coordsForStationName(stations.from?.name, COORDS.kungsbacka);
    const placeName = stations.from?.name || 'Kungsbacka';
    try {
      const { rain } = await checkTownRain(c.lat, c.lon);
      const icon = rain ? '☔' : '😊';
      const text = rain ? 'Regn väntas — ta med paraply' : 'Fint väder väntas hela dagen';
      el.innerHTML = `<div class="workinfo-row">
        <span class="workinfo-icon">${icon}</span>
        <div>
          <div class="workinfo-text">${text}</div>
          <div class="workinfo-sub">${placeName} · 07–18</div>
        </div>
      </div>`;
    } catch (e) {
      el.innerHTML = '<span class="empty">Work info ej tillgängligt</span>';
    }
  }

  function refreshBoth() {
    weather();
    workInfo();
  }
  window.addEventListener('dashboard:refresh-weather', refreshBoth);

  refreshBoth();
  setInterval(refreshBoth, 1800000);

addReloadButton('vader', '#vaderWrap');
addHideButton('vader', '#vaderWrap', 'weather');
addMoveButtons('vader', '#vaderWrap');
