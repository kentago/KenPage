const STOCK_OPTIONS = [
    { label: 'OMXS30', symbol: 'OMXSTO:OMXS30' },
    { label: 'Volvo B', symbol: 'OMXSTO:VOLV_B' },
    { label: 'Ericsson B', symbol: 'OMXSTO:ERIC_B' },
    { label: 'H&M B', symbol: 'OMXSTO:HM_B' },
    { label: 'ABB', symbol: 'OMXSTO:ABB' },
    { label: 'SEB A', symbol: 'OMXSTO:SEB_A' },
    { label: 'Saab B', symbol: 'OMXSTO:SAAB_B' },
    { label: 'Investor B', symbol: 'OMXSTO:INVE_B' },
    { label: 'Atlas Copco A', symbol: 'OMXSTO:ATCO_A' },
    { label: 'Sandvik', symbol: 'OMXSTO:SAND' },
    { label: 'SKF B', symbol: 'OMXSTO:SKF_B' },
    { label: 'Assa Abloy B', symbol: 'OMXSTO:ASSA_B' },
    { label: 'Alfa Laval', symbol: 'OMXSTO:ALFA' },
    { label: 'Boliden', symbol: 'OMXSTO:BOL' },
    { label: 'Electrolux B', symbol: 'OMXSTO:ELUX_B' },
    { label: 'Essity B', symbol: 'OMXSTO:ESSITY_B' },
    { label: 'Getinge B', symbol: 'OMXSTO:GETI_B' },
    { label: 'Hexagon B', symbol: 'OMXSTO:HEXA_B' },
    { label: 'Nordea', symbol: 'OMXSTO:NDA_SE' },
    { label: 'Swedbank A', symbol: 'OMXSTO:SWED_A' },
    { label: 'Handelsbanken A', symbol: 'OMXSTO:SHB_A' },
    { label: 'SCA B', symbol: 'OMXSTO:SCA_B' },
    { label: 'Skanska B', symbol: 'OMXSTO:SKA_B' },
    { label: 'Telia', symbol: 'OMXSTO:TELIA' },
    { label: 'Tele2 B', symbol: 'OMXSTO:TEL2_B' },
    { label: 'Autoliv', symbol: 'OMXSTO:ALIV_SDB' },
    { label: 'Epiroc A', symbol: 'OMXSTO:EPI_A' },
    { label: 'Evolution', symbol: 'OMXSTO:EVO' },
    { label: 'Kinnevik B', symbol: 'OMXSTO:KINV_B' },
    { label: 'Sinch', symbol: 'OMXSTO:SINCH' },
    { label: 'Nibe B', symbol: 'OMXSTO:NIBE_B' }
  ];
  const MAX_STOCKS = 8;

  function stockLabel(symbol) {
    return (STOCK_OPTIONS.find(o => o.symbol === symbol) || {}).label || symbol;
  }

  function renderStocksWidget() {
    const container = document.getElementById('stocksContainer');
    if (!container) return;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const symbols = cfg.stocks.map(sym => [stockLabel(sym), sym + '|1D']);
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;
    script.textContent = JSON.stringify({
      symbols, chartOnly: false, width: '100%', height: '220', locale: 'sv_SE', colorTheme: 'dark', autosize: false,
      showVolume: false, showMA: false, hideDateRanges: true, hideMarketStatus: false, hideSymbolLogo: true,
      scalePosition: 'right', scaleMode: 'Normal', fontFamily: 'Oswald,sans-serif', fontSize: '11',
      noTimeScale: false, valuesTracking: '1', changeMode: 'price-and-percent', chartType: 'area', lineWidth: 2,
      dateRanges: ['1d|1'], isTransparent: true,
      lineColor: 'rgba(245,166,35,1)', topColor: 'rgba(245,166,35,.1)', bottomColor: 'rgba(245,166,35,0)'
    });
    container.appendChild(script);
  }

  // Stocks being edited i inställningsmodalen, skrivs till cfg.stocks först vid Spara.
  let pendingStocks = [];

  function renderStocksList() {
    const listEl = document.getElementById('stocksList');
    if (!listEl) return;
    listEl.innerHTML = pendingStocks.map((sym, i) =>
      `<div class="stock-row"><span>${stockLabel(sym)}</span><span class="rm" data-i="${i}">✕</span></div>`
    ).join('') || '<div class="hint">Inga aktier valda.</div>';

    listEl.querySelectorAll('.rm').forEach(rm => rm.onclick = () => {
      pendingStocks.splice(parseInt(rm.dataset.i), 1);
      renderStocksList();
    });

    const addSel = document.getElementById('inAddStock');
    const available = STOCK_OPTIONS.filter(o => !pendingStocks.includes(o.symbol));
    addSel.innerHTML = '<option value="">— välj bolag att lägga till —</option>' +
      available.map(o => `<option value="${o.symbol}">${o.label}</option>`).join('');
  }

  const btnAddStock = document.getElementById('btnAddStock');
  if (btnAddStock) {
    btnAddStock.onclick = () => {
      const v = document.getElementById('inAddStock').value;
      if (v && pendingStocks.length < MAX_STOCKS && !pendingStocks.includes(v)) {
        pendingStocks.push(v);
        renderStocksList();
      }
    };
  }

  window.addEventListener('dashboard:refresh-stocks', renderStocksWidget);

  renderStocksWidget();
