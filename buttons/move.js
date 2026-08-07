/*
  Knapp: Flytta modul
  ---------------------
  ← och → för att flytta en modul ett steg åt gången mellan kolumnerna,
  som ett snabbare alternativ till dropdown-väljaren i inställningarna.

  Flytt sker alltid ETT steg, aldrig direkt från kolumn 3 till 1 — det tar
  två klick (3→2, sedan 2→1) att gå hela vägen, med avsikt (samma modell
  som Kenneth beskrev).

  Vilka pilar som visas beror på modulens nuvarande kolumn OCH hur många
  kolumner som är aktiva just nu (cfg.columnCount):
    - Kolumn 1: bara →
    - Kolumn 2 (när 3 kolumner är aktiva): både ← och →
    - Kolumn 2 (när bara 2 kolumner är aktiva): bara ← (ingen kolumn 3 att gå till)
    - Kolumn 3: bara ←

  Beroenden: core.js (måste vara laddad före denna fil), cfg, save() och
  renderModuleColumns() från skalets inline-skript. Måste laddas som vanlig
  <script src>, INTE type="module" (se README.md för varför).

  Användning från en modulscript:
    addMoveButtons('vader', '#weather');
*/

// Samma "vilken kolumn ligger modulen egentligen i just nu"-logik som
// renderModuleColumns() använder, så knapparna alltid stämmer med det som
// faktiskt visas på skärmen.
if (typeof getButtonBar !== 'function') {
  throw new Error('buttons/move.js kräver buttons/core.js — kontrollera att <script src="buttons/core.js"> står FÖRE denna tagg i dashboard.html <head>.');
}

function effectiveModuleColumn(key) {
  let assigned = cfg.moduleColumns[key] || 2;
  if (assigned === 3 && cfg.columnCount !== 3) assigned = 2;
  return assigned;
}

function moveModule(key, direction) {
  const current = effectiveModuleColumn(key);
  const next = current + direction;
  if (next < 1 || next > cfg.columnCount) return; // redan vid kanten, gör inget
  cfg.moduleColumns[key] = next;
  save();
  renderModuleColumns();
}

function addMoveButtons(key, wrapperSelector) {
  const bar = getButtonBar(wrapperSelector);
  if (!bar || bar.querySelector('.move-btn')) return;

  const col = effectiveModuleColumn(key);
  if (col > 1) {
    bar.appendChild(makeModuleBtn('←', 'Flytta ett steg åt vänster', () => moveModule(key, -1), 'move-btn'));
  }
  if (col < cfg.columnCount) {
    bar.appendChild(makeModuleBtn('→', 'Flytta ett steg åt höger', () => moveModule(key, 1), 'move-btn'));
  }
}
