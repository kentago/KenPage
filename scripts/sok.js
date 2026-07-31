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
      // Steg 1: försök hitta en exakt artikelrubrik/omdirigering (snabbt, precist,
      // men fungerar bara om frasen faktiskt är eller omdirigerar till en titel —
      // t.ex. "Sveriges huvudstad" har en sådan omdirigering, men de flesta
      // beskrivande frågor har det inte).
      const openSearchUrl = `https://sv.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json&origin=*`;
      const openSearchData = await fetchSokTimeout(openSearchUrl);
      let title = openSearchData?.[1]?.[0];

      // Steg 2: om det inte gav träff, prova en riktig fulltextsökning istället —
      // den matchar mot artikelinnehåll, inte bara rubriker, och hittar därför
      // betydligt oftare rätt artikel för beskrivande frågor som
      // "Kanadas huvudstad" (ingen egen rubrik, men texten finns i Kanada- eller
      // Ottawa-artikeln).
      if (!title) {
        const fullTextUrl = `https://sv.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=1&format=json&origin=*`;
        const fullTextData = await fetchSokTimeout(fullTextUrl);
        title = fullTextData?.query?.search?.[0]?.title;
      }

      if (!title) {
        resEl.innerHTML = `<span class="empty">Inget snabbsvar hittades.</span>` + googleLink(q);
        return;
      }

      // Steg 3: hämta en kort sammanfattning av artikeln
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
