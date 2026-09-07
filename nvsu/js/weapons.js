// Five weapons, shared loadout for both sides. `ammo: Infinity` means unlimited.
// `charge: true` weapons use hold-to-charge / release-to-fire.
const WEAPONS = [
  {
    id: 'bazooka',
    name: 'Tusk Lance',
    icon: '🚀',
    type: 'projectile',
    ammo: Infinity,
    charge: true,
    minSpeed: 7,
    maxSpeed: 17,
    gravity: true,
    wind: true,
    radius: 34,
    damage: 45,
  },
  {
    id: 'shotgun',
    name: 'Horn Blast',
    icon: '💥',
    type: 'hitscan',
    ammo: Infinity,
    charge: false,
    pellets: 5,
    spread: 0.18,
    range: 260,
    radius: 14,
    damage: 9,
  },
  {
    id: 'grenade',
    name: 'Spiral Bomb',
    icon: '🌀',
    type: 'grenade',
    ammo: 5,
    charge: true,
    minSpeed: 5,
    maxSpeed: 13,
    gravity: true,
    wind: true,
    bounce: 0.45,
    fuse: 2600,
    radius: 42,
    damage: 50,
  },
  {
    id: 'airstrike',
    name: 'Horn Rain',
    icon: '☄️',
    type: 'airstrike',
    ammo: 2,
    charge: false,
    count: 4,
    radius: 30,
    damage: 34,
  },
  {
    id: 'teleport',
    name: 'Rainbow Warp',
    icon: '✨',
    type: 'teleport',
    ammo: 2,
    charge: true,
    minDist: 20,
    maxDist: 170,
  },
];

function defaultAmmoSet() {
  const ammo = {};
  for (const w of WEAPONS) ammo[w.id] = w.ammo;
  return ammo;
}

function getWeapon(id) {
  return WEAPONS.find(w => w.id === id);
}
