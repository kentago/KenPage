const REGIONS = [
    { kw: ['kungsbacka', 'varberg', 'falkenberg', 'halmstad', 'laholm', 'anneberg'], id: 128, lbl: 'Halland' },
    { kw: ['göteborg', 'mölndal', 'partille', 'lerum', 'kungälv', 'uddevalla', 'trollhättan', 'borås'], id: 104, lbl: 'Väst' },
    { kw: ['malmö', 'lund', 'helsingborg', 'kristianstad', 'hässleholm', 'ystad'], id: 96, lbl: 'Skåne' },
    { kw: ['stockholm', 'solna', 'sundbyberg', 'nacka', 'huddinge', 'södertälje'], id: 103, lbl: 'Stockholm' },
    { kw: ['linköping', 'norrköping', 'motala'], id: 160, lbl: 'Östergötland' },
    { kw: ['jönköping', 'värnamo', 'nässjö'], id: 91, lbl: 'Jönköping' },
    { kw: ['karlstad', 'arvika', 'sunne'], id: 93, lbl: 'Värmland' },
    { kw: ['örebro', 'kumla', 'karlskoga'], id: 159, lbl: 'Örebro' },
    { kw: ['uppsala', 'enköping'], id: 114, lbl: 'Uppsala' },
    { kw: ['västerås', 'eskilstuna'], id: 112, lbl: 'Västmanland' },
    { kw: ['gävle', 'sandviken'], id: 99, lbl: 'Gävleborg' },
    { kw: ['falun', 'borlänge', 'mora'], id: 161, lbl: 'Dalarna' },
    { kw: ['sundsvall', 'härnösand'], id: 110, lbl: 'Västernorrland' },
    { kw: ['umeå', 'skellefteå'], id: 109, lbl: 'Västerbotten' },
    { kw: ['luleå', 'piteå', 'kiruna'], id: 98, lbl: 'Norrbotten' }
  ];

  function findRegion(name) {
    if (!name) return null;
    const n = name.toLowerCase();
    return REGIONS.find(r => r.kw.some(k => n.includes(k))) || null;
  }

  function slugify(str) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[ð]/g, 'd').replace(/[þ]/g, 'th')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  async function parseAtom(url, max, urlType = 'artikel', timeoutMs = 8000) {
    const items = [];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: controller.signal });
      if (!r.ok) return items;
      const xml = new DOMParser().parseFromString(await r.text(), 'text/xml');
      for (const e of xml.querySelectorAll('entry')) {
        const title = (e.querySelector('title')?.textContent || '').trim();
        const slug = slugify(title);
        const link = slug ? `https://www.sverigesradio.se/${urlType}/${slug}` : 'https://sverigesradio.se';
        const pub = (e.querySelector('published') || e.getElementsByTagName('published')[0])?.textContent || '';
        if (title.length > 10) {
          const t = new Date(pub);
          items.push({ title, link, time: isNaN(t) ? '' : t.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) });
        }
        if (items.length >= max) break;
      }
    } catch (e) { /* feed unreachable eller timeout — return what we have (possibly nothing) */
    } finally {
      clearTimeout(timer);
    }
    return items;
  }

  async function news() {
    const el = document.getElementById('news');
    const region = findRegion(stations.from?.name);
    let items = [];
    if (region) items = await parseAtom('https://api.sr.se/api/rss/program/' + region.id, 2, 'avsnitt');
    const nat = await parseAtom('https://api.sr.se/api/rss/program/4540', 4);
    items.push(...nat.map(n => ({ ...n, title: n.title.replace(/^Ekot \d{2}:\d{2}\s*/, '') })).filter(n => n.title.length > 5));
    items = items.slice(0, 6);

    if (!items.length) { el.innerHTML = '<div class="empty">Inga nyheter just nu</div>'; return; }
    el.innerHTML = items.map((n, i) => `
      <a class="news-item" href="${n.link}" target="_blank">
        <span class="news-num">${i + 1}</span>
        <span class="news-text">${n.title}</span>
        <div class="news-meta">${i < (region ? 2 : 0) ? '📍 Lokalt' : 'Ekot'}${n.time ? ' · ' + n.time : ''}</div>
      </a>`).join('');
  }

  window.addEventListener('dashboard:refresh-news', news);

  news();
  setInterval(news, 15 * 60000);

addReloadButton('nyheter', '#newsWrap');
addHideButton('nyheter', '#newsWrap', 'news');
addMoveButtons('nyheter', '#newsWrap');
