// Procedural lore-friendly names for pod members. Purely cosmetic —
// swap or extend these lists freely without touching game logic.

const NARWHAL_FIRST_NAMES = [
  'Kelgorin', 'Thrain', 'Bruundir', 'Skarn', 'Frosgar', 'Naugrim',
  'Borlok', 'Thundrek', 'Icewyn', 'Halvard', 'Grimsby', 'Vosgar',
  'Rimenor', 'Ockthar', 'Dravik',
];

const NARWHAL_SURNAMES = [
  'Icetusk', 'Deepfin', 'Tidebrine', 'Glacierhorn', 'Stormspar',
  'Northtide', 'Wavecrest', 'Fjordbane', 'Duskwhisker', 'Frostjaw',
  'Brinehelm', 'Coldcurrent', 'Tuskbreaker', 'Hoarwake', 'Undertow',
];

const UNICORN_FIRST_NAMES = [
  'Thalindra', 'Seraphina', 'Elowen', 'Liora', 'Aurelia', 'Celestine',
  'Ysolde', 'Faelynn', 'Rosalind', 'Ondine', 'Isolde', 'Marisol',
  'Evanthe', 'Calla', 'Wisteria',
];

const UNICORN_SURNAMES = [
  'Starmane', 'Moonglow', 'Dawnspire', 'Silverhorn', 'Prismwing',
  'Rosequartz', 'Duskbloom', 'Aurorion', 'Glimmershade', 'Opalwhistle',
  'Sunpetal', 'Nightbloom', 'Radiantmane', 'Emberhoof', 'Lucentveil',
];

function pickUnique(list, used) {
  if (used.size >= list.length) used.clear(); // fall back to reuse if we run dry
  let choice;
  do {
    choice = list[Math.floor(Math.random() * list.length)];
  } while (used.has(choice));
  used.add(choice);
  return choice;
}

function generatePodNames(firstNames, surnames, count) {
  const usedFirst = new Set();
  const usedLast = new Set();
  const names = [];
  for (let i = 0; i < count; i++) {
    names.push(`${pickUnique(firstNames, usedFirst)} ${pickUnique(surnames, usedLast)}`);
  }
  return names;
}
