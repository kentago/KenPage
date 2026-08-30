# Sjökrans Dashboard — projektöversikt

> **Syfte med detta dokument:** Detta dokument skak hjälpa till om man
> behöver börja om från noll — ny konversation, ny Claude-session, eller bara
> för att komma ihåg varför saker är byggda som de är — ska den här filen
> räcka för att förstå hela projektet utan att behöva läsa igenom historiken.
> Skriven för att briefa en Claude-agent som aldrig sett projektet förut.

## Vad är detta?

En personlig "kiosk-dashboard" som fungerar unikt per device
tanken är att köra på en surfplatta/skärm hemma och visar avgångar/reseplanering, väder,
nyheter, badtemperatur, elpris, aktiekurser, valutakurser och en
snabbsökningsruta — allt på en skärm, uppdaterat automatiskt.

**Live-URL:** `https://www.sjokrans.se/dashboard`
**Hosting:** AWS Amplify Hosting (kopplat till GitHub-repot nedan)
**GitHub:** `github.com/kentago/KenPage`
**DNS:** Route 53 (bara DNS — pekar mot Amplify, hostar inget själv)

## Filstruktur (allt ligger i repots rot)

```
dashboard.html          ← "skalet": layout, delat state, inställningar, modul-laddare
modules/
  nyheter.html           ← markup + <style> + <script src="scripts/nyheter.js">
  vader.html             ← väder + "work info" (regnkoll), samma fil/modul
  badtemperatur.html
  elpris.html
  aktier.html
  valuta.html
  sok.html
scripts/                 ← EGEN mapp på samma nivå som modules/, INTE inuti den
  nyheter.js
  vader.js
  badtemperatur.js
  elpris.js
  aktier.js
  valuta.js
  sok.js
```

`index.html` finns också i repot men är en **helt orelaterad välkomstsida**
— ignorera den alltid, den hör inte till dashboarden.

## Arkitektur: skal + moduler

Detta är **inte** en SPA med byggsteg. Ren HTML/CSS/vanilla JS, inga
ramverk, inget npm-byggsteg. Varje modul är en egen `.html`-fil som hämtas
med `fetch()` och injiceras i sidan vid körning.

### Hur en modul laddas (viktigt att förstå)

1. `dashboard.html` har en `MODULE_REGISTRY`-array (key, path, label) för
   varje modul.
2. `renderModuleColumns()` skapar en tom `<div class="module-slot">` per
   modul, sätter `data-module` till modulens sökväg, och lägger den i rätt
   kolumn-container (se "Kolumnsystem" nedan).
3. `loadModule(slot)` hämtar HTML-filen via `fetch()`, sätter
   `slot.innerHTML = html`. **`innerHTML` kör inte `<script>`-taggar
   automatiskt** — koden letar därför upp alla `<script>`-taggar i det
   injicerade innehållet och skapar NYA `<script>`-element via
   `document.createElement`, kopierar `src`/textContent, och ersätter de
   gamla. Det tvingar fram exekvering, både för inline-script och för
   `<script src="scripts/xxx.js">`.
4. Efter injicering anropas `applyToggles()` igen, så att visa/dölj-
   inställningen faktiskt slår igenom på element som precis skapades.

### Sökvägar är alltid relativa till SKAL-SIDAN, inte modulfilen

Både `data-module="modules/xxx.html"` och `<script src="scripts/xxx.js">`
inuti modulfilerna tolkas relativt till var `dashboard.html` ligger — inte
relativt till modulfilens egen plats. Detta fungerar konsekvent eftersom
webbläsaren löser `fetch()`-anrop och nyskapade `<script>`-elements mot
dokumentets bas-URL (skal-sidan), oavsett varifrån HTML-texten kom.

**Historisk bugg att komma ihåg:** när sajten låg på
`https://www.sjokrans.se/dashboard` (utan avslutande `/`) tolkade
webbläsaren "dashboard" som ett filnamn, inte en mapp, vilket fick relativa
sökvägar att peka en nivå för högt. Detta maskerades dessutom av att AWS
Amplifys automatiska SPA-rewrite-regel skickade alla "obefintliga" sökvägar
(inklusive riktiga 404:or) till `index.html` med statuskod 200 — så vartenda
felsökningsförsök såg ut att "lyckas" trots att fel fil visades. Lösningen
var att antingen ta bort den regeln eller lägga till `html` i listan av
skyddade filändelser i Amplifys rewrite-regex.

### Delat state (lever i skalet, inte i modulerna)

```js
let cfg = {
  apiKey: '',              // Trafiklab/ResRobot API-nyckel
  bathLocation: '',        // manuell override för badtemp (COORDS-nyckel), '' = auto
  elZone: '',               // manuell override elprisområde (SE1-4), '' = auto
  stocks: [...],            // valda TradingView-symboler, max 8
  currencies: [...],        // valda valutakoder, max 8
  columnCount: 2,            // 2 eller 3
  moduleColumns: {...},      // { modulnyckel: 1|2|3 } — vilken kolumn varje modul ligger i
  show: {...}                // { sektionsnyckel: bool } — visa/dölj per sektion
};
let stations = { from: null, to: null };  // valda start/mål-stationer
```

Sparas i `localStorage` under nycklarna `sjokrans-cfg` respektive
`sjokrans-stations`. Moduler läser/skriver dessa via **delat globalt
skript-scope** — eftersom alla `<script>`-taggar (både skalets egna och de
dynamiskt injicerade från moduler) körs som klassiska (icke-module) scripts
i samma dokument, delar de samma globala lexikaliska scope. En modul kan
alltså referera till `cfg.bathLocation` eller anropa `coordsForStationName()`
rakt av utan import/export.

**Viktigt att INTE göra:** lägg aldrig en `<script type="module">` någonstans
i det här projektet — då bryts det delade scopet och hela arkitekturen
slutar fungera.

### Kolumnsystem

Layouten har tre möjliga kolumner:

- **Kolumn 1** — alltid reseplaneraren (resa/avgångar-växel, sökruta,
  resultatlista). Moduler kan också placeras HÄR, direkt under
  reseplanerarens innehåll, i en egen `<div id="col1Modules">`.
- **Kolumn 2** — standardplats för moduler.
- **Kolumn 3** — syns bara om `cfg.columnCount === 3`. Om en modul är
  tilldelad kolumn 3 men `columnCount` är 2, faller den tillbaka till
  kolumn 2 automatiskt (se `renderModuleColumns()`).

Allt styrs från inställningsmodalen: en dropdown per modul (Kolumn 1/2/3)
plus en global "Antal kolumner"-väljare (2/3). `renderModuleColumns()`
bygger om alla tre kolumn-containrar och laddar om VARJE modul från grunden
varje gång inställningar sparas — enklare och mer robust än att försöka
flytta befintliga DOM-noder, till priset av en extra nätverksrunda per modul
vid varje "Spara".

### Visa/dölj-system

`SECTION_TOGGLES`-arrayen i skalet mappar en `cfg.show`-nyckel till
(ett eller flera) DOM-element-id:n och ett checkbox-id i inställnings-
modalen. `elId` kan vara antingen en sträng eller en array (t.ex. väder +
work info döljs tillsammans eftersom de visuellt hör ihop trots att de är
separata `<div>`:ar i samma modulfil).

**Kom ihåg:** lägger du till en ny modul måste den läggas till på **tre**
ställen manuellt: `MODULE_REGISTRY`, `SECTION_TOGGLES`, och en riktig
`<input type="checkbox">` i modalens HTML. Att glömma det sista är en bugg
som redan hänt en gång — koden kraschar tyst annars.

### Händelsebaserad uppdatering

Moduler lyssnar på egna `CustomEvent`:

- `dashboard:refresh-news`
- `dashboard:refresh-weather` (uppdaterar BÅDE väder och work info)
- `dashboard:refresh-bath`
- `dashboard:refresh-elpris`
- `dashboard:refresh-currency`
- `dashboard:refresh-stocks`

Skalet dispatchar dessa (t.ex. vid station-byte) istället för att anropa
modulernas funktioner direkt vid namn.

**Historisk bugg, viktig att förstå:** tidigt i moduluppdelningen anropade
skalets init-sekvens funktioner som `news()`/`weather()`/`workInfo()` direkt
och synkront, precis efter att den asynkrona modul-laddningen startats.
Eftersom de funktionerna bara existerar EFTER att respektive modul hunnit
laddas, kastade det ett `ReferenceError` som tystade **resten av det
körande skriptblocket** — vilket i sin tur gjorde att saker som
`nameday()`, som råkade stå efter i koden, aldrig kördes. Lösningen var
dels att flytta bort de direkta anropen och låta varje modul självinitiera
sig (kör sig själv + sätter sin egen `setInterval` så fort den laddats),
dels att gå över till händelsebaserad uppdatering för externt triggade
uppdateringar.

## API:er som används (alla gratis, ingen betald nyckel utom ResRobot)

| Modul | API | Nyckel krävs? | Anteckningar |
|---|---|---|---|
| Resor/Avgångar (skalet) | ResRobot v2.1, Trafiklab | Ja, gratis nivå | `trip`, `departureBoard`, `location.name` (autocomplete) |
| Nyheter | Sveriges Radio (`api.sr.se/api/rss/program/{id}`) | Nej | Regionala program-ID:n i `REGIONS`, nationellt Ekot = id 4540. Regionala länkar använder `/avsnitt/`, nationella `/artikel/` (SR:s faktiska URL-mönster). |
| Väder + Work info | Open-Meteo | Nej | Väder = 3-dagarsprognos. Work info = regnkoll timme 07–18 samma ort som väder, visar ☔ eller 😊. |
| Badtemperatur | Havs- och vattenmyndigheten (`gw.havochvatten.se`) | Nej | Hittar 3 närmaste badplatser till referenspunkt. |
| Elpris | elprisetjustnu.se | Nej | Auto-detekterar SE1-4 från "från"-station, eller manuell override. |
| Aktier | TradingView symbol-overview widget | Nej (extern embed) | ~30 valbara OMX Stockholm-bolag, max 8 valda. |
| Valutor | Frankfurter API (ECB-baserad) | Nej | Bas SEK, ~10 valbara valutor, max 8 valda. Uppdateras timvis (ECB uppdaterar bara dagligen). |
| Namnsdag (i skalet) | sholiday.faboul.se (primär), workgroup.se/api/namnsdag (reserv) | Nej | Reservkällans exakta svarsformat är **overifierat** — koden gissar sig fram genom flera möjliga fältnamn defensivt. |
| Snabbsökning | Wikipedia (opensearch + REST summary) + Google-länk | Nej | Wikipedia ger raka svar på entitetsfrågor ("Sveriges huvudstad"), sämre på fritextfrågor. Google-länk visas alltid som komplement/reserv. |

## Genomgående mönster värda att känna till

**Timeout på alla fetch-anrop.** Alla moduler som gör egna nätverksanrop
använder `AbortController` med 6–8 sekunders gräns. Detta lades till efter
att flera moduler (väder, badtemp, elpris, nyheter, namnsdag) visade sig
fastna på "Hämtar..." i all evighet om det externa API:et hängde sig utan
att svara — `fetch()` har ingen inbyggd timeout som standard.

**`shareLink()`-funktionen.** Rör inte denna utan att fråga Kenneth först
— den löser ett specifikt, medvetet avvägt behov kring att dela dashboarden
utan att behöva förklara här exakt hur.

**`applyToggles()` måste tåla element som inte finns än.** Eftersom
moduler laddas asynkront kan `applyToggles()` köras innan en modul hunnit
skapa sina DOM-element. Funktionen använder `if (el) ...`-guards och
anropas dessutom igen inifrån `loadModule()` efter varje enskild modul
laddats, så att visa/dölj-inställningen garanterat slår igenom oavsett
laddningsordning.

## Kända begränsningar / ej byggda saker

- **Ingen riktig drag-and-drop** för modulplacering — dropdown-väljare i
  inställningarna istället, medvetet val för enkelhetens skull.
- **Ingen ordning inom en kolumn** går att styra — moduler i samma kolumn
  visas i `MODULE_REGISTRY`:s ordning.
- **Namnsdags-reservkällan** (`workgroup.se`) har overifierat svarsformat.
- **Ingen Google Nest-integration** — utforskades men avfärdades eftersom
  det kräver en betald ($5 engångsavgift) Google-registrering, och
  Kenneth valde att avstå.
- **SMHI:s öppna väder-API** övervägdes som alternativ till Open-Meteo men
  valdes bort — betydligt råare dataformat (kodade parameternamn, ingen
  färdig dygnsaggregering) för samma slutresultat.

## Om du börjar om från noll

1. Läs den här filen i sin helhet först.
2. Titta på `dashboard.html` — leta upp `MODULE_REGISTRY`, `cfg`,
   `SECTION_TOGGLES`, `renderModuleColumns()` och `loadModule()` för att
   förstå arkitekturen konkret.
3. Öppna en modulfil (t.ex. `modules/vader.html`) + dess script
   (`scripts/vader.js`) för att se det etablerade mönstret innan du bygger
   en ny modul eller ändrar en befintlig.
4. Kom ihåg de tre registreringsställena för en ny modul (registry, toggle-
   lista, faktisk checkbox-HTML) — glöm inte det tredje.
5. Testa alltid syntax lokalt (`node --check`) på extraherad `<script>`-
   eller `.js`-kod innan filer levereras — flera buggar i det här projektet
   hade fångats direkt av det.
