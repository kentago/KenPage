/*
  Knapp: Ladda om modul
  -----------------------
  🔄-knapp som valfri modul kan lägga till i sin delade knapprad (se
  core.js). Hittar modulens nuvarande slot via data-module-key (satt av
  renderModuleColumns() i skalet) och tvingar fram en helt ny hämtning.

  Beroenden: core.js (måste vara laddad före denna fil), skalets
  loadModule(). Måste laddas som vanlig <script src>, INTE type="module".

  Användning från en modulscript:
    addReloadButton('vader', '#weather');
*/

if (typeof getButtonBar !== 'function') {
  throw new Error('buttons/reload.js kräver buttons/core.js — kontrollera att <script src="buttons/core.js"> står FÖRE denna tagg i dashboard.html <head>.');
}

function reloadModule(key) {
  const slot = document.querySelector(`[data-module-key="${key}"]`);
  if (slot) loadModule(slot);
}

function addReloadButton(key, wrapperSelector) {
  const bar = getButtonBar(wrapperSelector);
  if (!bar || bar.querySelector('.reload-btn')) return;
  bar.appendChild(makeModuleBtn('🔄', 'Ladda om denna modul', () => reloadModule(key), 'reload-btn'));
}
