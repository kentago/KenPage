// Top 10 valutor som brukar vara relevanta att kunna välja mellan.
  const CURRENCY_OPTIONS = [
    { code: 'EUR', label: 'Euro' },
    { code: 'USD', label: 'US-dollar' },
    { code: 'GBP', label: 'Brittiskt pund' },
    { code: 'NOK', label: 'Norsk krona' },
    { code: 'DKK', label: 'Dansk krona' },
    { code: 'JPY', label: 'Japansk yen' },
    { code: 'CHF', label: 'Schweizisk franc' },
    { code: 'CNY', label: 'Kinesisk yuan' },
    { code: 'CAD', label: 'Kanadensisk dollar' },
    { code: 'AUD', label: 'Australisk dollar' }
  ];
  const MAX_CURRENCIES = 8;

  function currencyLabel(code) {
    return (CURRENCY_OPTIONS.find(o => o.code === code) || {}).label || code;
  }

  async function fetchCurrencyWithTimeout(url, timeoutMs = 8000) {
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

  async function currencyRates() {
    const el = document.getElementById('currencyContent');
    if (!cfg.currencies.length) {
      el.innerHTML = '<span class="empty">Inga valutor valda.</span>';
      return;
    }
    try {
      const symbols = cfg.currencies.join(',');
      const data = await fetchCurrencyWithTimeout(`https://api.frankfurter.dev/v1/latest?base=SEK&symbols=${symbols}`);
      const rates = data.rates || {};
      el.innerHTML = `<div class="currency-items">` + cfg.currencies.map(code => {
        const rate = rates[code];
        return `<div class="currency-item">
          <div class="currency-pair">SEK → ${code}</div>
          <div class="currency-val">${rate !== undefined ? rate.toFixed(4) : '—'}</div>
        </div>`;
      }).join('') + `</div>`;
    } catch (e) {
      el.innerHTML = '<span class="empty">Kunde ej hämta valutakurser</span>';
    }
  }

  // Valutor under redigering i inställningsmodalen, skrivs till cfg.currencies först vid Spara.
  let pendingCurrencies = [];

  function renderCurrencyList() {
    const listEl = document.getElementById('currencyList');
    if (!listEl) return;
    listEl.innerHTML = pendingCurrencies.map((code, i) =>
      `<div class="currency-row"><span>SEK → ${code} (${currencyLabel(code)})</span><span class="rm" data-i="${i}">✕</span></div>`
    ).join('') || '<div class="hint">Inga valutor valda.</div>';

    listEl.querySelectorAll('.rm').forEach(rm => rm.onclick = () => {
      pendingCurrencies.splice(parseInt(rm.dataset.i), 1);
      renderCurrencyList();
    });

    const addSel = document.getElementById('inAddCurrency');
    const available = CURRENCY_OPTIONS.filter(o => !pendingCurrencies.includes(o.code));
    addSel.innerHTML = '<option value="">— välj valuta att lägga till —</option>' +
      available.map(o => `<option value="${o.code}">${o.code} — ${o.label}</option>`).join('');
  }

  const btnAddCurrency = document.getElementById('btnAddCurrency');
  if (btnAddCurrency) {
    btnAddCurrency.onclick = () => {
      const v = document.getElementById('inAddCurrency').value;
      if (v && pendingCurrencies.length < MAX_CURRENCIES && !pendingCurrencies.includes(v)) {
        pendingCurrencies.push(v);
        renderCurrencyList();
      }
    };
  }

  window.addEventListener('dashboard:refresh-currency', currencyRates);

  currencyRates();
  setInterval(currencyRates, 3600000);

addReloadButton('valuta', '#currencyWrap');
addHideButton('valuta', '#currencyWrap', 'currency');
addMoveButtons('valuta', '#currencyWrap');
