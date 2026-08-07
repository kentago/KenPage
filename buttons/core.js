/*
  Kärna för modul-knappar
  ------------------------
  Delad hjälpfunktion som skapar (eller återanvänder) en liten knapprad
  uppe i höger hörn av en modul. Övriga knapp-filer (reload.js, hide.js,
  move.js, ...) hämtar sin plats via denna funktion istället för att själva
  positionera sig med hårdkodade pixelvärden — då krockar knapparna aldrig
  med varandra när fler läggs till framöver, oavsett ordning de läggs till i.

  MÅSTE laddas FÖRST, före övriga filer i denna mapp.

  Användning från en knapp-fil:
    const bar = getButtonBar('#weather');
    if (bar) bar.appendChild(makeModuleBtn('🔄', 'Ladda om', () => {...}));
*/

function getButtonBar(wrapperSelector) {
  const wrapper = document.querySelector(wrapperSelector);
  if (!wrapper) return null;
  wrapper.style.position = 'relative';
  let bar = wrapper.querySelector('.module-btn-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'module-btn-bar';
    wrapper.appendChild(bar);
  }
  return bar;
}

function makeModuleBtn(symbol, title, onClick, extraClass = '') {
  const btn = document.createElement('button');
  btn.className = 'module-btn' + (extraClass ? ' ' + extraClass : '');
  btn.type = 'button';
  btn.textContent = symbol;
  btn.title = title;
  btn.onclick = (e) => { e.stopPropagation(); onClick(); };
  return btn;
}
