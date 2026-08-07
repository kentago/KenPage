/*
  Knapp: Dölj modul
  -------------------
  Snabbversion av att avmarkera modulens kryssruta i inställningarna —
  döljer modulen direkt utan att öppna hela inställningsmodalen. Modulen
  stannar dold tills du kryssar i den igen under ⚙ Inställningar (skriver
  till samma cfg.show-fält som kryssrutorna styr, så det är konsekvent).

  Beroenden: core.js (måste vara laddad före denna fil), cfg, save() och
  applyToggles() från skalets inline-skript. Måste laddas som vanlig
  <script src>, INTE type="module" (se README.md för varför).

  Användning från en modulscript:
    addHideButton('vader', '#weather', 'weather');
  Tredje argumentet är cfg.show-nyckeln (oftast samma som modulnyckeln, men
  t.ex. väder-modulen styrs av show-nyckeln "weather" inte "vader" — kolla
  SECTION_TOGGLES i dashboard.html om osäker).
*/

if (typeof getButtonBar !== 'function') {
  throw new Error('buttons/hide.js kräver buttons/core.js — kontrollera att <script src="buttons/core.js"> står FÖRE denna tagg i dashboard.html <head>.');
}

function hideModule(showKey) {
  cfg.show[showKey] = false;
  save();
  applyToggles();
}

function addHideButton(key, wrapperSelector, showKey = key) {
  const bar = getButtonBar(wrapperSelector);
  if (!bar || bar.querySelector('.hide-btn')) return;
  bar.appendChild(makeModuleBtn('−', 'Dölj denna modul (kryssa i igen under ⚙ för att visa)', () => hideModule(showKey), 'hide-btn'));
}
