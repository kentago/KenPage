const KEY="infinite-dungeon-1beta";
const API_BASE="https://bitter-tree-d030.kesj04.workers.dev";
const dwarves=["Durin Ironbeard","Borin Deepaxe","Kargan Stonepick","Thorin Mountainbeard","Dwalin Blackforge","Farin Axebreaker","Balin Goldvein","Gorin Redhammer"];
const intros=["The old miners spoke of a sealed kingdom beneath the mountains. You entered to discover what survived below.","A forgotten royal expedition vanished beneath the mountain. You descend to learn their fate.","A tremor opened an ancient shaft, and rumors of lost Dwarven treasures followed."];
const types=["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet","ring"];
const names={
  weapon:["Rusty Sword","Deepforge Axe","Skeleton King's Bone Sword","Goblin Assassin's Poison Dagger","Iron Mace","Obsidian Blade","Warhammer","Cleaver of the Deep","Runed Hatchet","Flamebrand","Crystal Rapier","Thornwhip","Shadow Dagger","Dwarven Battleaxe","Moonsilver Sword","Cursed Falchion","Bonecrusher Maul","Venomfang Spear","Titan's Edge","Stormbreaker","Ember Scimitar","Frozen Warblade","Ancient Glaive","Void Shard Knife"],
  helmet:["Iron Helm","Dragon's Helmet","Bone Helm","Runed Coif","Stonewall Helm","Crystal Crown","Shadow Hood","Dwarven War Helm","Obsidian Visor","Flame Circlet","Deepforge Casque","Titan Skull Cap","Spectral Cowl","Ancient Ward Helm","Moonstone Diadem"],
  armor:["Old Mail","Deepplate","Dragonscale Vest","Runed Chainmail","Obsidian Plate","Crystal Hauberk","Shadow Leather","Titan Breastplate","Dwarven Mithril Coat","Flameguard Plate","Bonehide Armor","Ancient Wardplate","Stoneforge Mail","Emberlaced Cuirass","Frozen Shell Armor"],
  boots:["Miner Boots","Swift Boots","Ironshod Greaves","Dragon Stompers","Shadow Steps","Crystal Treads","Flamewalk Sabatons","Deepstride Boots","Titan Walkers","Runed Sandals","Windrunner Boots","Stoneguard Boots","Obsidian Footwraps","Ancient Pathfinders"],
  shoulders:["Iron Pauldrons","Dragon Mantle","Bone Shoulderguards","Obsidian Spaulders","Titan Shoulderplates","Crystal Epaulets","Shadow Shroud Pads","Deepforge Pauldrons","Flamecrest Guards","Runed Shouldercaps","Stormwall Spaulders","Ancient Battleguards"],
  trousers:["Leather Trousers","Chainmail Leggings","Dragon Hide Pants","Deepforge Greaves","Crystal Legguards","Shadow Weave Pants","Titan Legplates","Obsidian Cuisses","Flamebrace Leggings","Runed Trousers","Ancient Wardlegs","Stoneguard Tassets"],
  cape:["Traveler's Cape","Shadowweave Cape","Dragon Cape","Cloak of the Deep","Flamecloak","Crystal Shroud","Titan Mantle","Voidwrap","Moonsilver Cloak","Windcaller Cape","Ancient Drape","Obsidian Shawl","Bone Lord's Mantle","Stormweave Cape"],
  amulet:["Stone Amulet","Moon Amulet","Dragon Tooth Pendant","Deepforge Medallion","Crystal Heart Necklace","Shadow Locket","Titan Torc","Obsidian Charm","Flame Pearl Amulet","Runed Gorget","Ancient Talisman","Bone Relic Chain","Stormstone Pendant","Void Eye Amulet","Lucky Clover Charm","Fortune Coin Pendant","Starfall Locket","Seer's Eye Amulet","Dwarf King's Medallion","Phoenix Heart Pendant","Kraken Tooth Necklace","Moonwell Charm","Sunfire Torc","Frostweave Pendant","Earthblood Amulet","Windcaller Necklace","Shadowheart Locket","Titan Soulchain","Voidwalker's Charm","Dragonblood Pendant","Spirit Anchor","Deathward Amulet","Luck of the Deep","Gemheart Torc","Alchemist's Vial Pendant"],
  ring:["Iron Ring","Moonstone Ring","Bone Ring","Ember Ring","Dwarven Signet","Crystal Band","Shadow Loop","Titan Seal","Dragon Coil","Obsidian Circle","Flame Spark Ring","Runed Band","Ancient Vow Ring","Void Touch Ring","Deepforge Signet","Stormcaller Ring","Frozen Tear Ring","Goldheart Band","Spirit Whisper Ring","Bloodstone Ring","Sapphire Promise","Ruby Wrath Ring","Emerald Life Band","Diamond Core Ring","Opal Shimmer","Topaz Fury Ring","Amethyst Dream","Garnet Fist Ring","Onyx Doom Ring","Pearl Wisdom Band","Jade Harmony Ring","Lapis Truth Ring","Amber Fossil Ring","Turquoise Sky Ring","Malachite Coil","Serpentine Loop","Aquamarine Flow","Citrine Sun Ring","Peridot Growth Band","Moonquartz Ring","Starstone Signet","Voidglass Ring","Dragonbone Band","Firecore Ring","Frostbite Loop","Thunderstone Ring","Earthheart Band","Shadowgem Coil","Soulstone Ring","Wraithband","Titanforge Ring","Doomstone Signet","Phoenix Ash Ring","Kraken Eye Ring","Lichfinger Band","Abyssal Loop","Celestial Ring","Golemcore Band","Wyrmscale Coil","Nethergem Ring"]
};
const arts={
  weapon:["⚔️","🪓","🗡️","🔨","⛏️","🏹","🔱"],
  helmet:["🪖","🐉","💀","👑","🎭","⛑️"],
  armor:["🛡️","🥋","🦺","🧥"],
  boots:["🥾","👢","🦶","👟"],
  shoulders:["🛡️","⚔️","🦴","💎"],
  trousers:["👖","🩳","🦿"],
  cape:["🧥","🦇","🌬️","✨"],
  amulet:["📿","🔮","💎","🪬","🧿"],
  ring:["💍","💎","🔴","🔵","🟡","⚪","🟢","🟣","🪨","✨","🖤","❤️","🧿","🪬","⭕","🔮","💠","♦️","🌟","💫","🌙","☀️","❄️","🔥","⚡","🌊","🍀","👁️"]
};
const traits=[
  "Bone Rend (+25% damage)","Grave Fortune (+2 Luck)","Dragonblood (+25% damage)","Veilstep (15% dodge)","Deep Luck (+2 Luck)","Poison Edge (+elemental damage)",
  "Lifesteal (heal 15% of damage dealt)","Flameburst (+elemental damage)","Frostbite (+elemental damage)","Thunderstrike (+elemental damage)","Shadow Meld (15% dodge)","Crystal Resonance (+10% kill XP)",
  "Titan Strength (+25% damage)","Void Touch (armor pierce)","Bloodlust (+60% damage when low HP)","Iron Will (-25% damage taken)","Windwalker (15% dodge)","Stoneguard (-25% damage taken)",
  "Soulbound (+2 all stats)","Mana Drain (heal 15% of damage dealt)","Berserker Rage (+60% damage when low HP)","Dwarven Fortitude (-25% damage taken)","Obsidian Shell (-25% damage taken)",
  "Phoenix Rebirth (revive once per run)","Death Mark (+35% vs wounded foes)","Spirit Link (heal 5% HP on kill)","Runic Surge (+2 INT)","Ancient Blessing (+1 all stats)",
  "Elemental Ward (halve element damage)","Deepforge Temper (+15% damage)","Moonlight Heal (regen in combat)","Thornmail (reflect 30% damage)","Echostrike (25% double strike)",
  "Crit Amplifier (bigger crits)","Dread Aura (enemies may cower)","Regeneration (regen in combat)","Venomcoat (+elemental damage)","Battle Fury (+60% damage when low HP)","Shieldbreaker (+30% vs bosses)"
];
// Ring-specific traits — these give bonuses that synergize with other rings
const ringTraits=[
  "Gemlink (+1 STR per ring worn)","Jeweler's Pride (+1 DEX per ring worn)",
  "Ringmaster (+1 INT per ring worn)","Crown of Fingers (+1 CHA per ring worn)",
  "Paired Resonance (2× if matching element ring)","Finger Ward (reduces finger loss chance)",
  "Gold Attraction (+10% gold from sells)","Lucky Find (+search bonus)",
  "Gem Fortitude (+2 HP per ring worn)","Dual Spark (double trait chance on next ring)",
  "Soul Chain (XP +5% per ring worn)","Void Link (ignore 1 damage per ring worn)",
  "Elemental Harmony (resist element damage per ring)","Deep Radiance (loot quality +1 per ring)",
  "Titan Grip (STR×rings for attack)","Arcane Loop (INT×rings for search)",
  "Ring of Greed (find rings more often)","Dwarf King's Legacy (+all stats per 5 rings)",
  "Constellation (+1 all stats if 8+ rings worn)","Perfect Ten (+5 all stats if all 10 slots filled)",
  "Fortune's Favor (+2 Luck)","Serendipity (+1 Luck per ring worn)","Dwarf's Blessing (+3 Luck)"
];
// Amulet-specific traits — luck, potions, fortune, protection
const amuletTraits=[
  "Fortune's Heart (+3 Luck)","Lucky Star (+2 Luck, +5% crit)","Potion Amplifier (healing ×1.5)",
  "Treasure Sense (better loot rolls)","Quest Compass (easier quest item discovery)",
  "Death Ward (survive one fatal hit per floor)","Gold Magnet (+25% gold from sells)",
  "Element Shield (reduce element damage by 50%)","Soul Keeper (retain 1 item on death)",
  "Luck of the Ancients (+5 Luck)","Trinket Collector (double trinket drop chance)",
  "Potion Brewer (rest heals 50% more)","Critical Fortune (crits give bonus gold)",
  "Finger Ward Amulet (prevent finger loss)","XP Amplifier (+15% XP from all sources)",
  "Second Chance (flee always succeeds once per floor)","Deep Sight (+3 INT for searching)",
  "Merchant's Eye (sell items for double gold)","Life Pulse (+1 HP per room explored)",
  "Dwarven Ancestry (+1 all stats)"
];
const rar=["common","uncommon","rare","epic","mythical","legendary","divine"];
const dep=["bronze","silver","gold","titan","platinum","glowing","prismatic","astral"];

const legendaryPrefixes=["Ancient","Eternal","Primordial","Godforged","Abyssal","Celestial","Void-Touched","Titanborn","Doomforged","Soulbound","Starfall","Worldbreaker","Mythkeeper's","Deathless","Dragonlord's"];
const legendarySuffixes=["of the Endless Deep","of Forgotten Kings","of the First Flame","of Eternal Night","of the World Below","of Shattered Realms","of the Last Dwarf","of Titan's Blood","of the Void","of Dragonfire","of the Undying","of Starlight"];

const questPrefixes=["Hydrogen","Helium","Lithium","Beryllium","Boron","Carbon","Nitrogen","Oxygen","Fluorine","Neon","Sodium","Magnesium","Aluminium","Silicon","Phosphorus","Sulfur","Chlorine","Argon","Potassium","Calcium","Scandium","Titanium","Vanadium","Chromium","Manganese","Iron","Cobalt","Nickel","Copper","Zinc","Gallium","Germanium","Arsenic","Selenium","Bromine","Krypton","Rubidium","Strontium","Yttrium","Zirconium","Niobium","Molybdenum","Technetium","Ruthenium","Rhodium","Palladium","Silver","Cadmium","Indium","Tin","Antimony","Tellurium","Iodine","Xenon","Caesium","Barium","Lanthanum","Cerium","Praseodymium","Neodymium","Promethium","Samarium","Europium","Gadolinium","Terbium","Dysprosium","Holmium","Erbium","Thulium","Ytterbium","Lutetium","Hafnium","Tantalum","Tungsten","Rhenium","Osmium","Iridium","Platinum","Gold","Mercury","Thallium","Lead","Bismuth","Polonium","Astatine","Radon","Francium","Radium","Actinium","Thorium","Protactinium","Uranium","Neptunium","Plutonium","Americium","Curium","Berkelium","Californium","Einsteinium","Fermium","Mendelevium","Nobelium","Lawrencium","Rutherfordium","Dubnium","Seaborgium","Bohrium","Hassium","Meitnerium","Darmstadtium","Roentgenium","Copernicium","Nihonium","Flerovium","Moscovium","Livermorium","Tennessine","Oganesson"];

const questItems=[
  // Trinkets & Artifacts (50+)
  "Moonstone Pick","Obsidian Compass","Deepforge Key","Runic Tablet","Ancient Sigil",
  "Ember Crystal","Stoneheart Shard","Goldvein Map","Shadowglass Lens","Titan Cog",
  "Iron Crown Fragment","Lava Pearl","Frozen Tear","Bone Relic","Spirit Lantern",
  "Dragon Scale Fragment","Void Prism","Sunstone Chip","Thunder Rune","Crystal Skull",
  "Mithril Thread","Bloodstone Eye","Ghost Chain Link","Serpent Fang","Phoenix Feather",
  "Dwarven War Horn","Abyssal Ink","Starfall Shard","Living Root","Demon Tooth",
  "Forgotten Coin","Shadow Silk","Flameheart Gem","Deepice Core","Warden's Badge",
  "Ancient Gearwork","Spectral Dust","Golem Heart","Basilisk Eye","Lich Finger Bone",
  "Storm Bottle","Void Sand","Titan's Nail","Crystal Seed","Bone Compass",
  "Enchanted Quill","Lavaforged Ingot","Frozen Crown Shard","Dragon Egg Shell",
  "World Tree Bark","Demon Blood Vial","Soulstone Fragment","Arcane Lens",
  "Dwarf King's Seal","Elemental Core","Primordial Amber"
];

const restSources=[
  {name:"Fountain of Youth",emoji:"⛲",type:"heal"},
  {name:"Stream of Life",emoji:"🌊",type:"heal"},
  {name:"Healing Spring",emoji:"💧",type:"heal"},
  {name:"Dwarven Ale Barrel",emoji:"🍺",type:"heal"},
  {name:"Glowing Mushroom Patch",emoji:"🍄",type:"heal"},
  {name:"Ancient Crystal Pool",emoji:"💎",type:"heal"},
  {name:"Ember Hearth",emoji:"🔥",type:"heal"},
  {name:"Moonwell",emoji:"🌙",type:"heal"},
  {name:"Blessed Shrine",emoji:"⛩️",type:"heal"},
  {name:"Spirit Wellspring",emoji:"👻",type:"heal"},
  {name:"Fountain of Fortune",emoji:"🍀",type:"luck"},
  {name:"Wishing Well",emoji:"🪙",type:"luck"},
  {name:"Seer's Pool",emoji:"🔮",type:"luck"},
  {name:"Basin of Fate",emoji:"✨",type:"luck"},
  {name:"Starlight Spring",emoji:"⭐",type:"luck"}
];

const npcNames=["Durin Ironbeard","Borin Deepaxe","Kargan Stonepick","Farin Axebreaker","Balin Goldvein","Gorin Redhammer","Thrain Firebeard","Nori Silverhand","Bofur Gemkeeper","Gimli Rocksplitter"];
const npcTitles=["Keeper of the Blue Hall","Lorewarden","Quest-Bearer","Ancient Scholar","Deep Cartographer","Rune Scribe","Flame Keeper","Iron Sage","Stone Oracle","Tomb Historian","Vault Warden","Crystal Seer","Bone Reader","Shadow Archivist","Forge Priest","Ruin Walker"];

const starterRings=[
  {name:"Grandfather's Iron Band",art:"💍",stats:{str:2},trait:"Dwarven Fortitude (-25% damage taken)",desc:"A simple band passed down for generations. Sturdy and reliable."},
  {name:"Mother's Moonstone Loop",art:"🌙",stats:{cha:2},trait:"Lucky Star (+2 Luck, +5% crit)",desc:"A delicate ring that brings fortune to those who wear it."},
  {name:"Scout's Shadow Ring",art:"🖤",stats:{dex:2},trait:"Windwalker (15% dodge)",desc:"Worn by dungeon scouts. Helps you dodge and flee."},
  {name:"Scholar's Crystal Eye",art:"🔮",stats:{int:2},trait:"Deep Sight (+3 INT for searching)",desc:"The gem pulses when secrets are near."},
  {name:"Warrior's Bloodstone",art:"🔴",stats:{str:1,dex:1},trait:"Berserker Rage (+60% damage when low HP)",desc:"Thrums with violent energy. For those who choose aggression."},
  {name:"Merchant's Goldheart",art:"🟡",stats:{cha:1,luck:1},trait:"Gold Attraction (+10% gold from sells)",desc:"A trader's lucky charm. Gold seems to follow you."},
  {name:"Seer's Void Eye",art:"👁️",stats:{int:1,luck:1},trait:"Treasure Sense (better loot rolls)",desc:"Whispers of hidden treasure echo from within."},
  {name:"Survivor's Bonering",art:"🦴",stats:{str:1,cha:1},trait:"Finger Ward (reduces finger loss chance)",desc:"Carved from bone. Protects what you value most — your fingers."}
];

const bossTemplates=[
  {name:"The Ironguard",titles:["of the Deep","of the Sealed Gate","of Forgotten Halls","of the Last Stand"]},
  {name:"The Warden",titles:["of Bones","of Flame","of the Abyss","of Shattered Realms"]},
  {name:"The Sentinel",titles:["of Crystal","of Shadow","of the Void","of Ancient Law"]},
  {name:"The Gatekeeper",titles:["of Doom","of the Titan Hall","of Frozen Depths","of Dragonfire"]},
  {name:"The Guardian",titles:["of the Crown","of Lost Souls","of the World Below","of Eternal Night"]},
  {name:"The Colossus",titles:["of Stone","of Thunder","of the Forge","of Starfall"]},
  {name:"The Devourer",titles:["of Light","of Hope","of the Living","of Worlds"]},
  {name:"The Overlord",titles:["of Rot","of Iron","of the Pit","of Cursed Depths"]}
];
const bossAbilities=[
  "Earthquake (stuns for 1 turn)","Fire Breath (burns for extra damage over 2 turns)",
  "Shadow Cloak (50% miss chance for 1 attack)","Life Drain (heals from damage dealt)",
  "Enrage (doubles attack when below 30% HP)","Armor Break (reduces your STR temporarily)",
  "Poison Cloud (damage each turn)","Frost Nova (reduces your DEX temporarily)",
  "Summon Minion (extra hit per turn)","Arcane Blast (ignores defense)",
  "Titan Slam (massive single hit)","Fear Aura (flee threshold +3)",
  "Regeneration (heals each turn)","Crystal Shield (absorbs first 2 hits)"
];

// Enemy pools (extracted from spawn() for global access)
const ENEMY_ELEMENTS=["Earth","Fire","Water","Air","Shadow","Arcane"];
const ENEMY_COMMON=[
  "Rat","Cave Spider","Bat","Mushroom Crawler","Slime","Maggot","Beetle","Centipede",
  "Mole Rat","Cave Lizard","Dustmite","Rock Grub","Tunnel Worm","Sewer Toad","Blind Fish",
  "Moss Creeper","Pebble Crab","Mud Slug","Fungal Spore","Glow Worm"
];
const ENEMY_MID=[
  "Goblin Scout","Goblin Assassin","Skeleton Soldier","Zombie Miner","Wraith","Dire Bat",
  "Stone Golem","Giant Spider","Troll","Orc Raider","Bandit","Cursed Dwarf","Bone Hound",
  "Shadow Lurker","Venomfang","Ghoul","Harpy","Hobgoblin","Undead Prospector","Manticore Pup"
];
const ENEMY_HARD=[
  "Basilisk","Medusa","Minotaur","Wyvern","Lich Apprentice","Iron Golem","Cave Troll",
  "Dire Wolf Alpha","Naga","Dark Elf Ranger","Ogre Chieftain","Spectral Knight","Gargoyle",
  "Chimera","Flesh Golem","Wraith Lord","Orc Warlord","Cursed Paladin","Bone Dragon Wyrmling",
  "Crystal Sentinel"
];
const ENEMY_ELITE=[
  "Dragon","Lich","Skeleton King","Demon","Balrog","Ancient Golem","Hydra","Beholder",
  "Vampire Lord","Death Knight","Mind Flayer","Phoenix","Kraken Tentacle","Titan Shade",
  "Elder Basilisk"
];
const ENEMY_BOSS=[
  "Ancient Dragon","Lich Emperor","Demon Lord","Shadow Titan","The Nameless One",
  "Dwarven King (Cursed)","World Serpent Fragment","Void Walker","Primordial Slime God"
];
