async function fetchSokTimeout(url, timeoutMs = 6000) {
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

  function googleLink(query) {
    return `<div class="sok-google">🔎 <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" rel="noopener">Sök "${query}" på Google</a></div>`;
  }

  async function runSok() {
    const q = document.getElementById('sokInput').value.trim();
    const resEl = document.getElementById('sokResult');
    if (!q) return;
    resEl.innerHTML = '<span class="empty">Söker...</span>';

    try {
      // Steg 1: hitta bästa matchande Wikipedia-artikel för sökfrasen
      const searchUrl = `https://sv.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json&origin=*`;
      const searchData = await fetchSokTimeout(searchUrl);
      const title = searchData?.[1]?.[0];

      if (!title) {
        resEl.innerHTML = `<span class="empty">Inget snabbsvar hittades.</span>` + googleLink(q);
        return;
      }

      // Steg 2: hämta en kort sammanfattning av artikeln
      const summaryUrl = `https://sv.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summary = await fetchSokTimeout(summaryUrl);
      const extract = summary.extract || '';
      const thumb = summary.thumbnail?.source;
      const pageUrl = summary.content_urls?.desktop?.page || `https://sv.wikipedia.org/wiki/${encodeURIComponent(title)}`;

      resEl.innerHTML = `
        <div class="sok-card">
          ${thumb ? `<img class="sok-thumb" src="${thumb}" alt="">` : ''}
          <div>
            <div class="sok-card-title">${summary.title || title}</div>
            <div class="sok-card-extract">${extract}</div>
            <a class="sok-card-link" href="${pageUrl}" target="_blank" rel="noopener">Läs mer på Wikipedia →</a>
          </div>
        </div>
        ${googleLink(q)}`;
    } catch (e) {
      resEl.innerHTML = `<span class="empty">Kunde inte hämta snabbsvar.</span>` + googleLink(q);
    }
  }

  document.getElementById('sokBtn').onclick = runSok;
  document.getElementById('sokInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSok();
  });
