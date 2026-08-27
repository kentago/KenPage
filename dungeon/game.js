const KEY="infinite-dungeon-v13";
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
  "Bone Rend","Grave Fortune","Dragonblood","Veilstep","Deep Luck","Poison Edge",
  "Lifesteal","Flameburst","Frostbite","Thunderstrike","Shadow Meld","Crystal Resonance",
  "Titan Strength","Void Touch","Bloodlust","Iron Will","Windwalker","Stoneguard",
  "Soulbound","Mana Drain","Berserker Rage","Dwarven Fortitude","Obsidian Shell",
  "Phoenix Rebirth","Death Mark","Spirit Link","Runic Surge","Ancient Blessing",
  "Elemental Ward","Deepforge Temper","Moonlight Heal","Thornmail","Echostrike",
  "Crit Amplifier","Dread Aura","Regeneration","Venomcoat","Battle Fury","Shieldbreaker"
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
const rar=["common","uncommon","rare","mythical"], dep=["bronze","silver","gold","titan","glowing"];
let S=JSON.parse(localStorage.getItem(KEY)||"null")||fresh();
let globalHall=[]; // Cached global leaderboard from D1

function fresh(){return{name:dwarves[Math.floor(Math.random()*dwarves.length)],nickname:"",level:1,xp:0,hp:10,maxHp:10,floor:1,x:0,y:0,prevX:0,prevY:0,gold:0,stats:{str:1,dex:1,int:1,cha:1},statBoostAvailable:true,rooms:{"1:0:0":{searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null}},inventory:[],equipment:{weapon:null,helmet:null,armor:null,boots:null,shoulders:null,trousers:null,cape:null,amulet:null,rings:Array(10).fill(null)},lostFingers:{left:[],right:[]},floorPositions:{},quests:[],log:[`📖 ${intros[Math.floor(Math.random()*intros.length)]}`]}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function key(){return`${S.floor}:${S.x}:${S.y}`}
function room(){return S.rooms[key()]||(S.rooms[key()]={searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null,rest:null})}
function d20(){return 1+Math.floor(Math.random()*20)}
function msg(t){S.log.unshift(t);S.log=S.log.slice(0,100);save();render()}
function makeItem(type){
  // --- SCALING: Loot quality grows SLOWER than danger ---
  // Loot power ≈ floor^1.2 (exploring current floor makes you stronger before descending)
  let lootScale=Math.pow(S.floor,1.2)+S.level*0.5;

  // Rarity roll — higher floors slightly increase rare/mythical chance
  let rarBoost=Math.min(0.1,S.floor*0.002);
  let z=Math.random();
  let r=z<(.65-rarBoost)?0:z<(.90-rarBoost*0.5)?1:z<(.985-rarBoost*0.2)?2:3;

  // Depth tier based on floor range (every 10 floors)
  let depIdx=Math.min(4,Math.floor((S.floor-1)/10));

  let i={
    id:crypto.randomUUID(),
    type,
    name:(type==="ring"||type==="amulet")?`${questPrefixes[Math.floor(Math.random()*questPrefixes.length)]} ${names[type][Math.floor(Math.random()*names[type].length)]}`:names[type][Math.floor(Math.random()*names[type].length)],
    rarity:rar[r],
    depth:dep[depIdx],
    art:arts[type][Math.floor(Math.random()*arts[type].length)],
    stats:{},
    trait:null
  };

  // --- STAT GENERATION ---
  // Primary stat uses lootScale (grows as floor^1.2)
  let p=["str","dex","int","cha"];
  let primary=p[Math.floor(Math.random()*4)];

  // Wide variance: 0.4x to 1.6x
  let variance=0.4+Math.random()*1.2;
  let primaryVal=Math.max(1,Math.round(lootScale*variance));

  // Rarity multiplier — NOT guaranteed to be stronger (per spec!)
  // Mythical gets wider variance, not strictly higher
  let rarMult=r===0?0.7+Math.random()*0.6:r===1?0.8+Math.random()*0.8:r===2?0.6+Math.random()*1.2:0.5+Math.random()*1.8;
  primaryVal=Math.max(1,Math.round(primaryVal*rarMult));

  i.stats[primary]=primaryVal;

  // Secondary stat (~60% chance, lower value)
  if(Math.random()<0.60){
    let secondary=p[Math.floor(Math.random()*4)];
    let secVal=Math.max(1,Math.round(primaryVal*(0.2+Math.random()*0.5)));
    i.stats[secondary]=(i.stats[secondary]||0)+secVal;
  }

  // Tertiary stat (~25% chance on rare+, even lower value)
  if(r>=2&&Math.random()<0.25){
    let tertiary=p[Math.floor(Math.random()*4)];
    let terVal=Math.max(1,Math.round(primaryVal*(0.1+Math.random()*0.3)));
    i.stats[tertiary]=(i.stats[tertiary]||0)+terVal;
  }

  // --- TRAITS ---
  // Chance increases with rarity and floor depth
  let traitChance=0.10+r*0.12+Math.min(0.2,S.floor*0.003);
  // Rings have higher trait chance — they're the key equipment as a Dwarf!
  if(type==="ring") traitChance+=0.20;
  // Amulets are luck/utility focused — also higher trait chance
  if(type==="amulet") traitChance+=0.25;
  if(Math.random()<traitChance){
    // Rings get ring-specific synergy traits 60% of the time
    if(type==="ring"&&Math.random()<0.6){
      i.trait=ringTraits[Math.floor(Math.random()*ringTraits.length)];
    } else if(type==="amulet"&&Math.random()<0.7){
      i.trait=amuletTraits[Math.floor(Math.random()*amuletTraits.length)];
    } else {
      i.trait=traits[Math.floor(Math.random()*traits.length)];
    }
  }
  // Rare chance of DOUBLE trait on mythical
  if(r===3&&Math.random()<0.15){
    let pool=type==="ring"&&Math.random()<0.5?ringTraits:type==="amulet"&&Math.random()<0.5?amuletTraits:traits;
    let second=pool[Math.floor(Math.random()*pool.length)];
    if(second!==i.trait) i.trait=i.trait+", "+second;
  }

  return i;
}
function slot(i){return i.type==="ring"?"rings":i.type}

// --- LEGENDARY ITEM GENERATION (critical success d20=20) ---
// These are unique, powerful items that feel like "no one else has found this"
const legendaryPrefixes=["Ancient","Eternal","Primordial","Godforged","Abyssal","Celestial","Void-Touched","Titanborn","Doomforged","Soulbound","Starfall","Worldbreaker","Mythkeeper's","Deathless","Dragonlord's"];
const legendarySuffixes=["of the Endless Deep","of Forgotten Kings","of the First Flame","of Eternal Night","of the World Below","of Shattered Realms","of the Last Dwarf","of Titan's Blood","of the Void","of Dragonfire","of the Undying","of Starlight"];

function makeLegendaryItem(){
  let type=types[Math.floor(Math.random()*types.length)];
  let lootScale=Math.pow(S.floor,1.2)+S.level*0.5;

  // Always mythical or rare
  let r=Math.random()<0.7?3:2; // 70% mythical, 30% rare

  // Depth is always at least current floor's tier, possibly one higher
  let depIdx=Math.min(4,Math.floor((S.floor-1)/10)+Math.floor(Math.random()*2));

  // Generate a unique legendary name
  let prefix=legendaryPrefixes[Math.floor(Math.random()*legendaryPrefixes.length)];
  let baseName=names[type][Math.floor(Math.random()*names[type].length)];
  let suffix=Math.random()<0.5?(" "+legendarySuffixes[Math.floor(Math.random()*legendarySuffixes.length)]):"";
  let itemName=`${prefix} ${baseName}${suffix}`;

  let i={
    id:crypto.randomUUID(),
    type,
    name:itemName,
    rarity:rar[r],
    depth:dep[depIdx],
    art:arts[type][Math.floor(Math.random()*arts[type].length)],
    stats:{},
    trait:null
  };

  // Stats are MASSIVELY boosted — top end of variance + guaranteed multiple stats
  let p=["str","dex","int","cha"];
  let primary=p[Math.floor(Math.random()*4)];
  let primaryVal=Math.max(3,Math.round(lootScale*1.8*(1.2+Math.random()*0.8))); // 1.8x base, high variance
  i.stats[primary]=primaryVal;

  // Always has secondary stat
  let secondary=p.filter(x=>x!==primary)[Math.floor(Math.random()*3)];
  i.stats[secondary]=Math.max(1,Math.round(primaryVal*(0.4+Math.random()*0.4)));

  // 60% chance of tertiary stat
  if(Math.random()<0.6){
    let tertiary=p.filter(x=>x!==primary&&x!==secondary)[Math.floor(Math.random()*2)];
    i.stats[tertiary]=Math.max(1,Math.round(primaryVal*(0.2+Math.random()*0.3)));
  }

  // ALWAYS has a trait, 40% chance of double trait
  i.trait=traits[Math.floor(Math.random()*traits.length)];
  if(Math.random()<0.4){
    let second=traits[Math.floor(Math.random()*traits.length)];
    if(second!==i.trait) i.trait=i.trait+", "+second;
  }

  return i;
}

// --- OBTAIN: auto-equip if slot empty, else to inventory, else discard modal ---
let pendingItem=null; // item waiting for discard decision

function obtain(i){
  let s=slot(i);
  // Block weapon equip if right hand is completely lost
  if(s==="weapon"&&S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5){
    if(S.inventory.length<30){S.inventory.push(i);return`🎒 ${i.name} added to inventory (right hand mangled — cannot wield).`}
    pendingItem=i;showDiscardModal(i);return`⚠️ Inventory full! Choose an item to discard.`;
  }
  // Auto-equip if slot is empty
  if(s==="rings"){
    let n=S.equipment.rings.findIndex((x,idx)=>!x&&!isFingerLost(idx));
    if(n>=0){S.equipment.rings[n]=i;return`💍 ${i.name} auto-equipped.`}
  } else if(!S.equipment[s]){
    S.equipment[s]=i;
    return`⚔️ ${i.name} auto-equipped.`;
  }
  // Try to add to inventory
  if(S.inventory.length<30){
    S.inventory.push(i);
    return`🎒 ${i.name} added to extra inventory.`;
  }
  // Inventory full — trigger discard modal
  pendingItem=i;
  showDiscardModal(i);
  return`⚠️ Inventory full! Choose an item to discard.`;
}

function showDiscardModal(newItem){
  let html=`<div class="discard-overlay" id="discardModal">
    <div class="discard-box">
      <h3>⚠️ Inventory Full (30/30)</h3>
      <p>Choose ONE item to discard permanently to make room for:</p>
      <div class="item ${newItem.rarity} ${newItem.depth}"><span class="art">${newItem.art}</span><b>${newItem.name}</b>
        <div>${Object.entries(newItem.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
        ${newItem.trait?`<div>Trait: ${newItem.trait}</div>`:""}
        <div class="small">${newItem.rarity} · ${newItem.depth}</div>
        <button onclick="discardChoice('new')">❌ Discard this new item</button>
      </div>
      <h4>🎒 Inventory</h4>
      <div class="discard-list">${S.inventory.map((x,i)=>`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b>
        <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
        ${x.trait?`<div>Trait: ${x.trait}</div>`:""}
        <div class="small">${x.rarity} · ${x.depth}</div>
        <button onclick="discardChoice('inv',${i})">❌ Discard</button>
      </div>`).join("")}</div>
      <h4>⚔️ Equipped</h4>
      <div class="discard-list">${["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].map(k=>S.equipment[k]?`<div class="item ${S.equipment[k].rarity} ${S.equipment[k].depth}"><span class="art">${S.equipment[k].art}</span><b>${S.equipment[k].name}</b> (${k})
        <div>${Object.entries(S.equipment[k].stats).map(([kk,v])=>`+${v} ${kk.toUpperCase()}`).join(" · ")}</div>
        <button onclick="discardChoice('eq','${k}')">❌ Discard</button>
      </div>`:"").filter(x=>x).join("")}${S.equipment.rings.map((x,i)=>x?`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b> (ring ${i+1})
        <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
        <button onclick="discardChoice('ring',${i})">❌ Discard</button>
      </div>`:"").filter(x=>x).join("")}</div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

function discardChoice(type,idx){
  let modal=document.getElementById("discardModal");
  if(modal)modal.remove();
  if(!pendingItem)return;

  if(type==="new"){
    // Discard the new item — do nothing, it's gone
    msg(`🗑️ ${pendingItem.name} permanently destroyed. It is gone forever.`);
  } else if(type==="inv"){
    // Discard inventory item at idx, add pending item in its place
    let discarded=S.inventory[idx];
    S.inventory[idx]=pendingItem;
    msg(`🗑️ ${discarded.name} permanently destroyed. ${pendingItem.name} kept.`);
  } else if(type==="eq"){
    // Discard equipped item, put pending in inventory (now has space)
    let discarded=S.equipment[idx];
    S.equipment[idx]=null;
    S.inventory.push(pendingItem);
    msg(`🗑️ ${discarded.name} permanently destroyed. ${pendingItem.name} added to inventory.`);
  } else if(type==="ring"){
    // Discard equipped ring
    let discarded=S.equipment.rings[idx];
    S.equipment.rings[idx]=null;
    S.inventory.push(pendingItem);
    msg(`🗑️ ${discarded.name} permanently destroyed. ${pendingItem.name} added to inventory.`);
  }
  pendingItem=null;
  save();render();
}

// --- ITEM DISPLAY ---
function item(i,inv,equipped){
  let buttons="";
  if(inv) buttons+=`<button onclick="equip('${i.id}')">⬆️ Equip</button><button onclick="discard('${i.id}')">🗑️ Drop</button>`;
  if(equipped) buttons+=`<button onclick="unequip('${i.id}','${equipped}')">⬇️ Unequip</button>`;
  return`<div class="item ${i.rarity} ${i.depth}"><span class="art">${i.art}</span><b>${i.name}</b><div>${Object.entries(i.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>${i.trait?`<div class="trait">⚡ ${i.trait}</div>`:""}<div class="small">${i.rarity[0].toUpperCase()+i.rarity.slice(1)} · ${i.depth[0].toUpperCase()+i.depth.slice(1)}</div>${buttons}</div>`;
}

// --- EQUIP: always swaps (old goes to inventory) ---
function equip(id){
  let n=S.inventory.findIndex(i=>i.id===id);
  if(n<0)return;
  let i=S.inventory[n], s=slot(i);

  // Block weapon equip if right hand is mangled
  if(s==="weapon"&&S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5){
    return msg("⚠️ Your right hand is mangled — you cannot wield weapons.");
  }

  if(s==="rings"){
    let f=S.equipment.rings.findIndex((x,idx)=>!x&&!isFingerLost(idx));
    if(f>=0){
      // Empty ring slot — just move it there
      S.equipment.rings[f]=i;
      S.inventory.splice(n,1);
    } else {
      // All ring slots full (or lost) — show ring swap picker
      showRingSwapModal(id);
      return;
    }
  } else {
    let old=S.equipment[s];
    S.equipment[s]=i;
    if(old) S.inventory[n]=old;
    else S.inventory.splice(n,1);
  }
  save();render();
}

function showRingSwapModal(itemId){
  let html=`<div class="discard-overlay" id="ringSwapModal">
    <div class="discard-box">
      <h3>💍 All Ring Slots Full</h3>
      <p>Choose which ring to swap out (it will go to inventory):</p>
      <div class="discard-list">${S.equipment.rings.map((x,i)=>{
        if(isFingerLost(i)) return"";
        return x?`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b> (slot ${i+1})
        <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
        ${x.trait?`<div>Trait: ${x.trait}</div>`:""}
        <button onclick="swapRing('${itemId}',${i})">🔄 Swap this one</button>
      </div>`:"";}).filter(x=>x).join("")}</div>
      <button onclick="document.getElementById('ringSwapModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

function swapRing(itemId,ringIdx){
  let modal=document.getElementById("ringSwapModal");
  if(modal)modal.remove();
  let n=S.inventory.findIndex(i=>i.id===itemId);
  if(n<0)return;
  let newRing=S.inventory[n];
  let oldRing=S.equipment.rings[ringIdx];
  S.equipment.rings[ringIdx]=newRing;
  S.inventory[n]=oldRing;
  msg(`💍 Swapped ${oldRing.name} for ${newRing.name}.`);
  save();render();
}

// --- UNEQUIP: move equipped item to inventory ---
function unequip(id,slotKey){
  if(S.inventory.length>=30) return msg("⚠️ Inventory full — cannot unequip.");

  if(slotKey.startsWith("ring")){
    let idx=parseInt(slotKey.replace("ring",""));
    let i=S.equipment.rings[idx];
    if(!i)return;
    S.equipment.rings[idx]=null;
    S.inventory.push(i);
  } else {
    let i=S.equipment[slotKey];
    if(!i)return;
    S.equipment[slotKey]=null;
    S.inventory.push(i);
  }
  save();render();
}

// --- DISCARD: permanently drop an inventory item ---
function discard(id){
  let n=S.inventory.findIndex(i=>i.id===id);
  if(n<0)return;
  let name=S.inventory[n].name;
  S.inventory.splice(n,1);
  msg(`🗑️ ${name} permanently destroyed. It is gone forever.`);
  save();render();
}

// --- LOST FINGERS ---
// Ring slots 0-4 = Left hand (shield hand), 5-9 = Right hand (weapon hand)
// Each subsequent finger loss on the same hand becomes rarer
// Losing all 5 on right hand = can't wield weapon
// Losing all 5 on left hand = can't wield shield (armor penalty)

function isFingerLost(idx){
  if(!S.lostFingers) S.lostFingers={left:[],right:[]};
  if(idx<5) return S.lostFingers.left.includes(idx);
  return S.lostFingers.right.includes(idx-5);
}

function totalLostFingers(){
  if(!S.lostFingers) S.lostFingers={left:[],right:[]};
  return S.lostFingers.left.length+S.lostFingers.right.length;
}

function fingerLossChance(){
  // Base chance decreases exponentially with each lost finger
  // 0 lost: 1.0x, 1 lost: 0.6x, 2: 0.35x, 3: 0.2x, ... 9: almost impossible
  let lost=totalLostFingers();
  return Math.pow(0.55, lost);
}

function loseFinger(){
  if(!S.lostFingers) S.lostFingers={left:[],right:[]};

  // Roll against progressive difficulty
  if(Math.random()>fingerLossChance()) return;

  // Find available fingers (not already lost)
  let available=[];
  for(let i=0;i<5;i++){
    if(!S.lostFingers.left.includes(i)) available.push({hand:"left",idx:i,slot:i});
  }
  for(let i=0;i<5;i++){
    if(!S.lostFingers.right.includes(i)) available.push({hand:"right",idx:i,slot:i+5});
  }
  if(available.length===0) return; // all 10 already lost

  let pick=available[Math.floor(Math.random()*available.length)];
  if(pick.hand==="left") S.lostFingers.left.push(pick.idx);
  else S.lostFingers.right.push(pick.idx);

  let handName=pick.hand==="left"?"Left":"Right";
  let fingerNum=pick.idx+1;

  // If a ring was equipped on that finger, it's destroyed
  if(S.equipment.rings[pick.slot]){
    let lost=S.equipment.rings[pick.slot];
    S.equipment.rings[pick.slot]=null;
    msg(`🩸 ${handName} hand, finger ${fingerNum} severed! ${lost.name} shatters and is lost forever.`);
  } else {
    msg(`🩸 ${handName} hand, finger ${fingerNum} severed! Ring slot permanently gone.`);
  }

  // Check if entire hand is lost
  if(pick.hand==="right"&&S.lostFingers.right.length>=5){
    // Lost all right hand fingers — can't hold weapon
    if(S.equipment.weapon){
      let w=S.equipment.weapon;
      S.equipment.weapon=null;
      if(S.inventory.length<30) S.inventory.push(w);
      msg(`⚠️ Your right hand is completely mangled! ${w.name} slips from your grip. You can no longer wield weapons.`);
    } else {
      msg(`⚠️ Your right hand is completely mangled! You can no longer wield weapons.`);
    }
  }
  if(pick.hand==="left"&&S.lostFingers.left.length>=5){
    // Lost all left hand fingers — can't hold shield/armor penalty
    msg(`⚠️ Your left hand is completely mangled! You can no longer hold a shield. Defense weakened.`);
  }
}

// --- HALL OF FAME: Global D1 API + localStorage fallback ---
function countItems(){
  let count=S.inventory.length;
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{if(S.equipment[k])count++});
  count+=S.equipment.rings.filter(x=>x).length;
  return count;
}

async function submitToGlobalHall(){
  const entry={
    name:S.name,
    nickname:S.nickname||"Secret Hero",
    xp:S.xp,
    level:S.level,
    floor:S.floor,
    items:countItems(),
    country:S.country||""
  };

  // Always save to localStorage as fallback
  let local=JSON.parse(localStorage.getItem("infiniteDungeonHall")||"[]");
  local.push(entry);
  local.sort((a,b)=>b.xp-a.xp||b.level-a.level||b.floor-a.floor||b.items-a.items);
  local=local.slice(0,10);
  localStorage.setItem("infiniteDungeonHall",JSON.stringify(local));

  // Submit to global D1 API
  try{
    const res=await fetch(`${API_BASE}/submit`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(entry)
    });
    if(res.ok){
      console.log("🏆 Submitted to Global Hall of Fame");
      await fetchGlobalHall(); // Refresh the global leaderboard
    }
  }catch(err){
    console.warn("⚠️ Could not reach Global Hall of Fame API, using local fallback.",err);
  }
}

async function fetchGlobalHall(){
  try{
    const res=await fetch(`${API_BASE}/leaderboard`);
    if(res.ok){
      const data=await res.json();
      if(data.ok&&data.leaderboard){
        globalHall=data.leaderboard;
        renderHall();
        return;
      }
    }
  }catch(err){
    console.warn("⚠️ Could not fetch Global Hall of Fame, using local fallback.",err);
  }
  // Fallback: use localStorage
  globalHall=JSON.parse(localStorage.getItem("infiniteDungeonHall")||"[]");
  renderHall();
}

function renderHall(){
  const list=globalHall.length?globalHall:JSON.parse(localStorage.getItem("infiniteDungeonHall")||"[]");
  hall.innerHTML=list.slice(0,10).map((x,i)=>`<div class="card hall-entry">
    <span class="hall-rank">#${i+1}</span>
    ${countryFlag(x.country)} <b>${x.nickname||"Secret Hero"}</b> — ${x.name}
    <div class="small">XP ${x.xp} · Level ${x.level} · Floor ${x.floor} · Items ${x.items}</div>
  </div>`).join("")||"<div class=small>No completed expeditions yet.</div>";
}

// --- DEATH HANDLING ---
function damage(n){
  S.hp=Math.max(0,S.hp-n);
  if(S.hp===0){
    S.hp=0;
    msg("☠️ HP reached 0. The expedition has ended.");
    // Submit to global Hall of Fame
    submitToGlobalHall();
  } else {
    render();
  }
}

function spawn(){
  // --- ENEMY GENERATION SYSTEM ---
  // Tiers: common (floors 1+), mid (floors 5+), hard (floors 15+), elite (floors 30+), boss (floors 50+)
  const elements=["Earth","Fire","Water","Air","Shadow","Arcane"];
  const common=[
    "Rat","Cave Spider","Bat","Mushroom Crawler","Slime","Maggot","Beetle","Centipede",
    "Mole Rat","Cave Lizard","Dustmite","Rock Grub","Tunnel Worm","Sewer Toad","Blind Fish",
    "Moss Creeper","Pebble Crab","Mud Slug","Fungal Spore","Glow Worm"
  ];
  const mid=[
    "Goblin Scout","Goblin Assassin","Skeleton Soldier","Zombie Miner","Wraith","Dire Bat",
    "Stone Golem","Giant Spider","Troll","Orc Raider","Bandit","Cursed Dwarf","Bone Hound",
    "Shadow Lurker","Venomfang","Ghoul","Harpy","Hobgoblin","Undead Prospector","Manticore Pup"
  ];
  const hard=[
    "Basilisk","Medusa","Minotaur","Wyvern","Lich Apprentice","Iron Golem","Cave Troll",
    "Dire Wolf Alpha","Naga","Dark Elf Ranger","Ogre Chieftain","Spectral Knight","Gargoyle",
    "Chimera","Flesh Golem","Wraith Lord","Orc Warlord","Cursed Paladin","Bone Dragon Wyrmling",
    "Crystal Sentinel"
  ];
  const elite=[
    "Dragon","Lich","Skeleton King","Demon","Balrog","Ancient Golem","Hydra","Beholder",
    "Vampire Lord","Death Knight","Mind Flayer","Phoenix","Kraken Tentacle","Titan Shade",
    "Elder Basilisk"
  ];
  const boss=[
    "Ancient Dragon","Lich Emperor","Demon Lord","Shadow Titan","The Nameless One",
    "Dwarven King (Cursed)","World Serpent Fragment","Void Walker","Primordial Slime God"
  ];

  // Pick tier based on floor
  let pool;
  let roll=Math.random();
  if(S.floor>=50 && roll<0.05) pool=boss;
  else if(S.floor>=30 && roll<0.15) pool=elite;
  else if(S.floor>=15 && roll<0.35) pool=hard;
  else if(S.floor>=5 && roll<0.55) pool=mid;
  else pool=common;

  // At deeper floors, higher tiers become more common
  if(S.floor>=20 && pool===common && Math.random()<0.4) pool=mid;
  if(S.floor>=40 && pool===mid && Math.random()<0.3) pool=hard;

  let baseName=pool[Math.floor(Math.random()*pool.length)];

  // Assign element (~60% chance, more common at depth)
  let element=null;
  let elementChance=0.3+Math.min(0.4,S.floor*0.01);
  if(Math.random()<elementChance){
    element=elements[Math.floor(Math.random()*elements.length)];
  }

  // Build enemy name
  let name=element?`${element} ${baseName}`:baseName;

  // --- DANGER SCALING: grows as floor^1.6 (much faster than loot at floor^1.2) ---
  // This creates the "should I go deeper?" tension
  let dangerScale=Math.pow(S.floor,1.6);

  // HP scales with danger and tier
  let tierMultiplier=pool===common?1:pool===mid?1.5:pool===hard?2.2:pool===elite?3.5:5;
  let hp=Math.max(3,Math.round((3+dangerScale*0.8+Math.random()*dangerScale*0.3)*tierMultiplier));

  // Attack power scales with danger
  let atk=Math.max(1,Math.round((0.5+dangerScale*0.2+Math.random()*dangerScale*0.1)*tierMultiplier*0.5));

  // Element bonus damage (extra on top, scales with danger)
  let elementDmg=0;
  if(element){
    elementDmg=Math.max(0,Math.round(dangerScale*0.05));
  }

  return{name,hp,atk,element,elementDmg,tier:pool===common?"common":pool===mid?"mid":pool===hard?"hard":pool===elite?"elite":"boss"};
}

// --- NPC SYSTEM ---
const npcNames=["Durin Ironbeard","Borin Deepaxe","Kargan Stonepick","Farin Axebreaker","Balin Goldvein","Gorin Redhammer","Thrain Firebeard","Nori Silverhand","Bofur Gemkeeper","Gimli Rocksplitter"];
const npcTitles=["Keeper of the Blue Hall","Lorewarden","Quest-Bearer","Ancient Scholar","Deep Cartographer","Rune Scribe","Flame Keeper","Iron Sage","Stone Oracle","Tomb Historian","Vault Warden","Crystal Seer","Bone Reader","Shadow Archivist","Forge Priest","Ruin Walker"];
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

// Quest difficulty determines how far away the item likely is
const questDifficulty=["nearby","moderate","distant","legendary"];

const questPrefixes=["Hydrogen","Helium","Lithium","Beryllium","Boron","Carbon","Nitrogen","Oxygen","Fluorine","Neon","Sodium","Magnesium","Aluminium","Silicon","Phosphorus","Sulfur","Chlorine","Argon","Potassium","Calcium","Titanium","Chromium","Iron","Cobalt","Nickel","Copper","Zinc","Gallium","Germanium","Arsenic","Selenium","Bromine","Krypton","Rubidium","Strontium","Zirconium","Niobium","Molybdenum","Silver","Tin","Antimony","Iodine","Xenon","Barium","Tungsten","Platinum","Gold","Mercury","Lead","Bismuth","Uranium","Plutonium","Osmium","Palladium","Rhodium","Iridium"];

function uniqueQuestItemName(){
  // Pick a base name, ensure it's not already active
  let activeNames=S.quests.map(q=>q.itemName);
  let attempts=0;
  let name;
  do{
    name=questItems[Math.floor(Math.random()*questItems.length)];
    if(!activeNames.includes(name)) return name;
    // Duplicate — add periodic table prefix
    let prefix=questPrefixes[Math.floor(Math.random()*questPrefixes.length)];
    name=`${prefix} ${name}`;
    attempts++;
  } while(activeNames.includes(name)&&attempts<10);
  return name;
}

function spawnNPC(){
  let name=npcNames[Math.floor(Math.random()*npcNames.length)];
  let title=npcTitles[Math.floor(Math.random()*npcTitles.length)];
  let questItem=uniqueQuestItemName();

  // Difficulty = how many floors down the item is hidden
  // This determines both reward AND where you need to search
  let floorsDown=0;
  let diffRoll=Math.random();
  if(diffRoll<0.35) floorsDown=0; // Same floor
  else if(diffRoll<0.60) floorsDown=1; // 1 floor down
  else if(diffRoll<0.80) floorsDown=2; // 2 floors down
  else if(diffRoll<0.92) floorsDown=3; // 3 floors down
  else floorsDown=4+Math.floor(Math.random()*3); // 4-6 floors down (legendary)

  let diff=floorsDown===0?"same floor":floorsDown===1?"1 floor down":floorsDown<=3?`${floorsDown} floors down`:"deep below";
  let targetFloor=S.floor+floorsDown;

  // XP reward scales with distance and danger at target floor
  let targetDanger=Math.pow(targetFloor,1.6);
  let baseXP=Math.round(targetDanger*(0.8+floorsDown*0.5)+20+floorsDown*30);

  // Item reward chance (further = better rewards)
  let itemReward=null;
  if(floorsDown>=4||(floorsDown>=3&&Math.random()<0.4)){
    itemReward=true;
  }

  // Clear, specific hint so player knows exactly where to search
  let hint=floorsDown===0?`"It is hidden somewhere on this very floor. Search every chamber."`:
           floorsDown===1?`"I last saw it one floor below. Descend and search carefully."`:
           floorsDown<=3?`"It lies ${floorsDown} floors beneath us. You must descend and explore floor ${targetFloor}."`:
           `"It is buried deep — floor ${targetFloor} or beyond. A perilous journey awaits."`;

  return{name,title,questItem,xpReward:baseXP,difficulty:diff,targetFloor,floorsDown,hint,itemReward,completed:false};
}

function talkNPC(){
  let r=room();
  if(!r.npc||r.npc.completed)return;

  // Each NPC has unique ID by room location
  if(!r.npc.id) r.npc.id=`npc_${S.floor}:${S.x}:${S.y}`;

  // Check if player has THIS NPC's quest item found
  let existingQuest=S.quests.find(q=>q.npcId===r.npc.id&&q.found);
  if(existingQuest){
    deliverQuest(r.npc,existingQuest);
    return;
  }

  // Check if THIS NPC's quest is already active
  let active=S.quests.find(q=>q.npcId===r.npc.id);
  if(active){
    msg(`🔵 ${r.npc.name} says: "Still searching for the ${r.npc.questItem}? ${r.npc.hint}"`);
    return;
  }

  // Give new quest tied to THIS specific NPC
  let quest={
    npcId:r.npc.id,
    npcName:r.npc.name,
    itemName:r.npc.questItem,
    found:false,
    npcFloor:S.floor,
    npcX:S.x,
    npcY:S.y,
    xpReward:r.npc.xpReward,
    difficulty:r.npc.difficulty,
    itemReward:r.npc.itemReward
  };
  S.quests.push(quest);
  let diffLabel=r.npc.difficulty==="nearby"?"⚪":r.npc.difficulty==="moderate"?"🔵":r.npc.difficulty==="distant"?"🟠":"🟣";
  msg(`🔵 ${r.npc.name}, ${r.npc.title}, has a quest:\n\nFind: "${r.npc.questItem}" ${diffLabel} ${r.npc.difficulty}\n${r.npc.hint}\nReward: ${r.npc.xpReward} XP${r.npc.itemReward?" + 🎁 Special item":""}`);
  save();render();
}

function deliverQuest(npc,quest){
  // Award XP
  S.xp+=quest.xpReward;

  // --- REWARD ROLL (d20 + luck) ---
  // Even low-floor quests can give items with a lucky roll!
  let luckBonus=S.stats.luck||0; // Luck stat from trinkets/potions/ring traits
  let rewardRoll=d20()+luckBonus;
  let giveItem=false;

  if(quest.itemReward){
    // Guaranteed item for deep quests
    giveItem=true;
  } else if(rewardRoll>=20){
    // Lucky roll! Bonus item even on nearby quests
    giveItem=true;
    msg(`🍀 Lucky reward! The NPC is so grateful they give you something extra!`);
  } else if(rewardRoll>=17&&(quest.floorsDown||0)>=1){
    // Good roll + at least 1 floor distance
    giveItem=true;
    msg(`🍀 Bonus reward!`);
  }

  if(giveItem){
    let rewardItem=makeItem(types[Math.floor(Math.random()*types.length)]);
    // Quest reward items are at least uncommon and get a bonus
    if(rewardItem.rarity==="common") rewardItem.rarity="uncommon";
    // Boost scales with quest distance
    let boost=1.2+Math.random()*0.4+(quest.floorsDown||0)*0.15;
    for(let k in rewardItem.stats) rewardItem.stats[k]=Math.round(rewardItem.stats[k]*boost);
    // Ensure a trait
    if(!rewardItem.trait){
      let pool=rewardItem.type==="ring"&&Math.random()<0.6?ringTraits:traits;
      rewardItem.trait=pool[Math.floor(Math.random()*pool.length)];
    }
    msg(`🎁 ${npc.name} rewards you with: ${rewardItem.name}! ${obtain(rewardItem)}`);
  }

  // Chance of bonus potion/trinket on high luck
  if(rewardRoll>=18){
    let potionRoll=Math.random();
    if(potionRoll<0.3){
      S.stats.luck=(S.stats.luck||0)+1;
      msg(`🧪 ${npc.name} also slips you a Lucky Trinket. (+1 Luck permanently!)`);
    } else if(potionRoll<0.5){
      let healAmt=Math.round(S.maxHp*0.3);
      S.hp=Math.min(S.maxHp,S.hp+healAmt);
      msg(`🧪 ${npc.name} gives you a Healing Potion. (+${healAmt} HP!)`);
    }
  }

  // Remove quest from active quests
  S.quests=S.quests.filter(q=>q!==quest);
  // Mark NPC as completed
  npc.completed=true;
  // Check level up
  checkLevelUp();
  msg(`✅ ${npc.name} accepts the ${quest.itemName}!\n🎉 +${quest.xpReward} XP awarded!`);
  save();render();
}

function checkLevelUp(){
  let needed=S.level*50+S.level*S.level*10;
  while(S.xp>=needed){
    S.level++;
    let hpGain=5+Math.floor(S.level*1.5);
    S.maxHp+=hpGain;
    let heal=Math.floor(hpGain*0.7);
    S.hp=Math.min(S.maxHp,S.hp+heal);
    // Increase a random stat
    let stats=["str","dex","int","cha"];
    let pick=stats[Math.floor(Math.random()*stats.length)];
    S.stats[pick]+=1+Math.floor(S.level/5);
    msg(`📈 Level ${S.level}! +${hpGain} Max HP, healed ${heal} HP, +${1+Math.floor(S.level/5)} ${pick.toUpperCase()}`);
    needed=S.level*50+S.level*S.level*10;
  }
}

// --- REST SYSTEM ---
// Rest sources are permanent room features with limited uses (d20 determines sips)
// Healing scales as % of maxHP so it stays relevant at all levels
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

function spawnRestSource(){
  let source=restSources[Math.floor(Math.random()*restSources.length)];
  // d20 determines how many sips (3-12 range, higher = luckier)
  let sips=3+Math.floor(d20()*0.5);
  // Heal amount = % of maxHP (15-35%, so always relevant)
  let healPct=0.15+Math.random()*0.20;
  return{name:source.name,emoji:source.emoji,type:source.type,sips,maxSips:sips,healPct,depleted:false};
}

function useRest(){
  let r=room();
  if(!r.rest||r.rest.depleted)return;
  if(r.rest.sips<=0){
    r.rest.depleted=true;
    msg(`${r.rest.emoji} ${r.rest.name} is depleted. Nothing remains.`);
    save();render();
    return;
  }

  // D20 roll — critical fail means polluted/cursed!
  let roll=d20();

  if(roll===1){
    // CRITICAL FAIL — poisoned/cursed!
    r.rest.sips--;
    if(r.rest.type==="luck"){
      // Cursed luck fountain — LOSE luck
      let luckLoss=1+Math.floor(Math.random()*2);
      S.stats.luck=Math.max(0,(S.stats.luck||0)-luckLoss);
      msg(`🔮 The ${r.rest.name} is CURSED! Misfortune washes over you. -${luckLoss} Luck!`);
    } else {
      let poisonDmg=Math.max(2,Math.round(S.maxHp*r.rest.healPct*0.8));
      msg(`☠️ The ${r.rest.name} is POLLUTED! You drink tainted water and take ${poisonDmg} poison damage!`);
      damage(poisonDmg);
    }
    // 20% chance permanently corrupted
    if(Math.random()<0.20){
      r.rest.depleted=true;
      if(r.rest.type==="luck"){
        msg(`💀 The ${r.rest.name} dims and goes dark. Its magic is forever broken.`);
      } else {
        msg(`🟤 The ${r.rest.name} turns foul and black. It is permanently corrupted.`);
      }
    }
    save();render();
    return;
  }

  if(roll<=3){
    // Bad sip — reduced effect + minor negative
    r.rest.sips--;
    if(r.rest.type==="luck"){
      msg(`${r.rest.emoji} The ${r.rest.name} flickers dimly... No effect this time. ${r.rest.sips}/${r.rest.maxSips} sips left.`);
    } else {
      let weakHeal=Math.max(1,Math.round(S.maxHp*r.rest.healPct*0.3));
      let poisonDmg=Math.max(1,Math.round(S.maxHp*0.05));
      let net=weakHeal-poisonDmg;
      S.hp=Math.min(S.maxHp,Math.max(0,S.hp+net));
      msg(`${r.rest.emoji} The ${r.rest.name} tastes bitter... +${weakHeal} HP but -${poisonDmg} poison. (${S.hp}/${S.maxHp}) ${r.rest.sips}/${r.rest.maxSips} sips left.`);
    }
    save();render();
    return;
  }

  // --- GOOD SIP ---
  r.rest.sips--;

  if(r.rest.type==="luck"){
    // Luck fountain — boost luck and other finding bonuses
    let luckGain=roll>=20?3:roll>=17?2:1;
    S.stats.luck=(S.stats.luck||0)+luckGain;
    let bonusMsg=roll>=20?" 💥 The stars align! Massive fortune!":roll>=17?" ✨ Fortune smiles upon you!":"";
    if(r.rest.sips<=0){
      r.rest.depleted=true;
      msg(`${r.rest.emoji} You gaze into the ${r.rest.name}.${bonusMsg} +${luckGain} Luck! (Total: ${S.stats.luck}) 🍀 Depleted — the magic fades.`);
    } else {
      msg(`${r.rest.emoji} You gaze into the ${r.rest.name}.${bonusMsg} +${luckGain} Luck! (Total: ${S.stats.luck}) ${r.rest.sips}/${r.rest.maxSips} sips remaining.`);
    }
  } else {
    // Heal fountain
    let healMult=roll>=20?1.5:roll>=17?1.2:1.0;
    let healAmt=Math.max(1,Math.round(S.maxHp*r.rest.healPct*healMult));
    let oldHp=S.hp;
    S.hp=Math.min(S.maxHp,S.hp+healAmt);
    let actualHeal=S.hp-oldHp;
    let bonusMsg=roll>=20?" 💥 The waters glow with divine power!":roll>=17?" ✨ An exceptionally refreshing sip!":"";

    if(r.rest.sips<=0){
      r.rest.depleted=true;
      msg(`${r.rest.emoji} You drink from the ${r.rest.name}.${bonusMsg} +${actualHeal} HP (${S.hp}/${S.maxHp}). 💚 Depleted — no sips remain.`);
    } else {
      msg(`${r.rest.emoji} You drink from the ${r.rest.name}.${bonusMsg} +${actualHeal} HP (${S.hp}/${S.maxHp}). ${r.rest.sips}/${r.rest.maxSips} sips remaining.`);
    }
  }
  save();render();
}
window.useRest=useRest;

// --- TRADER SYSTEM ---
const traderNames=["Will Stonehand","Borin the Merchant","Durin the Collector","Kargan the Huntsman","Nori the Broker","Thrain Goldbarter","Gimli Coinkeeper","Farin Gemdealer"];
const traderTitles=["Master Trader","Wandering Merchant","Deep Market Keeper","Dungeon Peddler","Loot Collector","Treasure Broker"];

function spawnTrader(){
  let name=traderNames[Math.floor(Math.random()*traderNames.length)];
  let title=traderTitles[Math.floor(Math.random()*traderTitles.length)];
  return{name,title};
}

function talkTrader(){
  let r=room();
  if(!r.trader)return;

  // Sell items for gold
  if(S.inventory.length===0){
    msg(`💲 ${r.trader.name}, ${r.trader.title}, says: "Nothing to trade? Come back when you have goods."`);
    return;
  }
  // Show sell interface
  showTraderModal(r.trader);
}

function showTraderModal(trader){
  let html=`<div class="discard-overlay" id="traderModal">
    <div class="discard-box">
      <h3>💲 ${trader.name}, ${trader.title}</h3>
      <p>"Show me what you've got. I'll pay fair gold."</p>
      <div class="discard-list">${S.inventory.map((x,i)=>{
        let value=Math.max(1,Math.floor((Object.values(x.stats).reduce((a,b)=>a+b,0))*2+(rar.indexOf(x.rarity)+1)*5));
        return`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b>
        <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
        <div class="small">${x.rarity} · ${x.depth}</div>
        <button onclick="sellItem(${i},${value})">💰 Sell for ${value} gold</button>
      </div>`;}).join("")}</div>
      <button onclick="document.getElementById('traderModal').remove()">Done Trading</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

function sellItem(idx,value){
  let modal=document.getElementById("traderModal");
  if(modal)modal.remove();
  let item=S.inventory[idx];
  if(!item)return;
  S.inventory.splice(idx,1);
  S.gold+=value;
  msg(`💰 Sold ${item.name} for ${value} gold.`);
  save();render();
}
function search(){let r=room();if(r.enemy&&r.enemy.hp>0)return msg("⚔️ Search is unavailable during combat.");if(r.searched)return;r.searched=true;

  // --- QUEST ITEM DISCOVERY (d20 based) ---
  // Items can ONLY be found on the quest's target floor (or current floor for "same floor" quests)
  let activeQuests=S.quests.filter(qq=>!qq.found&&(qq.targetFloor===S.floor||(!qq.targetFloor&&qq.npcFloor===S.floor)));
  if(activeQuests.length>0){
    let searchRoll=d20();
    let quest=activeQuests[Math.floor(Math.random()*activeQuests.length)];
    // Base threshold — easier to find on the correct floor (you're in the right place!)
    let findThreshold=12;
    // INT bonus helps searching
    findThreshold-=Math.floor(S.stats.int/15);
    // Clamp minimum
    findThreshold=Math.max(4,findThreshold);

    if(searchRoll===20){
      // CRITICAL SUCCESS — always find it
      quest.found=true;
      if(r.secret) quest.xpReward=Math.floor(quest.xpReward*3);
      msg(`💥 CRITICAL SEARCH! You discover the ${quest.itemName} in a hidden alcove! ✅ Ready to deliver.${r.secret?" (Secret passage bonus: 3× XP!)":""}`);
      save();render();return;
    } else if(searchRoll>=findThreshold){
      // Normal success — find the quest item
      quest.found=true;
      if(r.secret) quest.xpReward=Math.floor(quest.xpReward*3);
      msg(`🔎 You find the ${quest.itemName}! ✅ Ready to deliver.${r.secret?" (Secret passage bonus: 3× XP!)":""}`);
      save();render();return;
    } else if(searchRoll===1){
      // CRITICAL FAIL on search — bad consequence
      let badOutcome=Math.random();
      if(badOutcome<0.3){
        msg(`💥 Critical search failure! A trap activates!`);
        damage(Math.max(2,Math.round(Math.pow(S.floor,1.2)*0.3)));
        if(Math.random()<0.15)loseFinger();
      } else if(badOutcome<0.6){
        msg(`💥 Critical search failure! You disturb something. An enemy appears!`);
        r.enemy=spawn();
      } else {
        msg(`💥 Critical search failure! The ground crumbles. You lose an item!`);
        if(S.inventory.length>0){
          let lostIdx=Math.floor(Math.random()*S.inventory.length);
          let lostItem=S.inventory[lostIdx];
          S.inventory.splice(lostIdx,1);
          msg(`🗑️ ${lostItem.name} falls into the void. Gone forever.`);
        }
      }
      save();render();return;
    }
    // Didn't find quest item — continue to normal search
  }

  // --- SECRET PASSAGE (separate chance, checked first) ---
  if(Math.random()<0.10){
    r.secret={dir:["N","E","S","W"][Math.floor(Math.random()*4)]};
    msg("✨ A secret passage is revealed!");
    save();render();return;
  }

  // --- NORMAL SEARCH RESULTS (d20 based) ---
  let searchRoll=d20();

  if(searchRoll===20){
    // CRITICAL LOOT SUCCESS — legendary find, forced high rarity + boosted stats
    let i=makeLegendaryItem();
    msg(`💥 CRITICAL FIND! Something extraordinary gleams in the darkness...\n🎁 ${i.name} found! ${obtain(i)}`);
    return;
  }
  if(searchRoll>=16){
    // Great find — guaranteed uncommon+
    let i=makeItem(types[Math.floor(Math.random()*types.length)]);
    if(i.rarity==="common"){i.rarity="uncommon";}
    msg(`🎁 ${i.name} found! ${obtain(i)}`);
    return;
  }
  if(searchRoll>=10){
    // Normal loot
    let i=makeItem(types[Math.floor(Math.random()*types.length)]);
    msg(`🎁 ${i.name} found. ${obtain(i)}`);
    return;
  }
  if(searchRoll>=6){
    // Nothing useful
    msg("🔎 You find nothing of interest.");
    return;
  }
  if(searchRoll>=2){
    // Trap!
    msg("⚠️ A hidden trap strikes!");
    damage(Math.max(1,Math.round(Math.pow(S.floor,1.2)*0.2)));
    if(Math.random()<0.12)loseFinger();
    return;
  }
  // searchRoll === 1: Critical fail (already handled above for quests, this is fallback)
  msg("⚠️ A hidden trap strikes!");
  damage(Math.max(2,Math.round(Math.pow(S.floor,1.2)*0.3)));
  if(Math.random()<0.15)loseFinger();
  }

// --- RECIPROCAL BLOCKING ---
const OPP={N:"S",S:"N",E:"W",W:"E"};
const DIR_DX={N:0,S:0,E:1,W:-1};
const DIR_DY={N:-1,S:1,E:0,W:0};

function enforceReciprocal(floor,x,y,dir){
  let rk=`${floor}:${x}:${y}`;
  let rm=S.rooms[rk];
  if(rm) rm.blocked[dir]=true;

  let nx=x+DIR_DX[dir], ny=y+DIR_DY[dir];
  let nk=`${floor}:${nx}:${ny}`;
  let nr=S.rooms[nk];
  if(nr) nr.blocked[OPP[dir]]=true;
}

function move(d){
  let r=room();
  if(r.blocked[d])return;
  if(r.enemy&&r.enemy.hp>0)return msg("⚔️ A foe blocks the way.");

  // Remember where we came from (for flee)
  S.prevX=S.x;
  S.prevY=S.y;

  let nx=S.x+DIR_DX[d], ny=S.y+DIR_DY[d];
  let nk=`${S.floor}:${nx}:${ny}`;
  let nr=S.rooms[nk];

  // Check if the destination room already knows this direction is blocked (reciprocal)
  if(nr&&nr.blocked[OPP[d]]){
    r.blocked[d]=true;
    save();
    return msg("🚫 That route is known to be closed.");
  }

  // Generate blockage randomly for new rooms (~20% chance)
  if(!nr && Math.random()<0.20){
    enforceReciprocal(S.floor,S.x,S.y,d);
    save();render();
    return msg("🧱 A solid wall blocks this path.");
  }

  // Move to new position
  S.x=nx; S.y=ny;
  let x=room();

  // For new rooms: randomly block some OTHER directions to create maze structure
  if(!nr){
    let dirs=["N","S","E","W"].filter(dd=>dd!==OPP[d]);
    for(let dd of dirs){
      if(Math.random()<0.25){
        enforceReciprocal(S.floor,S.x,S.y,dd);
      }
    }
    // Spawn enemy?
    if(!(S.floor===1&&S.x===0&&S.y===0)&&Math.random()<0.28){
      x.enemy=spawn();
    }
    // Spawn NPC? (~8% chance, no enemy in room)
    if(!x.enemy&&Math.random()<0.08){
      x.npc=spawnNPC();
    }
    // Spawn trader? (~6% chance, no enemy/npc)
    if(!x.enemy&&!x.npc&&Math.random()<0.06){
      x.trader=spawnTrader();
    }
    // Spawn ladder down? (~10% chance, no enemy blocking it)
    if(!x.enemy&&!x.ladder&&Math.random()<0.10){
      x.ladder={dir:"down",used:false,targetKey:null};
    }
    // Spawn rest source? (~7% chance)
    if(!x.rest&&Math.random()<0.07){
      x.rest=spawnRestSource();
    }
  }

  // --- FLOOR COMPLETION CHECK ---
  // If all exits are explored/blocked and no ladder down exists, spawn a portal
  checkFloorEscape();

  save();render();
}

function checkFloorEscape(){
  // Check if there's any ladder down on this floor
  let hasLadderDown=false;
  // Check if there's any room with unexplored exits
  let hasUnexploredExit=false;

  for(let k of Object.keys(S.rooms)){
    let parts=k.split(":");
    if(parseInt(parts[0])!==S.floor)continue;
    let rm=S.rooms[k];

    if(rm.ladder&&rm.ladder.dir==="down") hasLadderDown=true;

    let rx=parseInt(parts[1]),ry=parseInt(parts[2]);
    for(let dir of["N","S","E","W"]){
      if(rm.blocked&&rm.blocked[dir])continue;
      let nx=rx+DIR_DX[dir],ny=ry+DIR_DY[dir];
      let nk=`${S.floor}:${nx}:${ny}`;
      if(!S.rooms[nk]){
        hasUnexploredExit=true;
        break;
      }
    }
    if(hasLadderDown&&hasUnexploredExit)return;
  }

  if(hasLadderDown)return; // Ladder exists somewhere on this floor

  if(!hasUnexploredExit){
    // All exits blocked, no ladder — spawn a mysterious portal in current room
    let r=room();
    if(!r.ladder){
      r.ladder={dir:"down",used:false,targetKey:null};
      msg("🌀 The walls shimmer... A mysterious portal materializes! The dungeon demands you descend.");
    }
  }
}

function fight(){let r=room();if(!r.enemy||r.enemy.hp<=0)return;let hit=d20();if(hit===1){msg(`💥 Critical miss! ${r.enemy.name} counterattacks.`);let counterDmg=Math.max(1,(r.enemy.atk||3)+d20()%3);damage(counterDmg);if(Math.random()<0.08)loseFinger();return}
  // Right hand mangled = severely reduced attack
  let rightMangled=S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5;
  let leftMangled=S.lostFingers&&S.lostFingers.left&&S.lostFingers.left.length>=5;
  let atkBonus=rightMangled?1:Math.floor(S.stats.str/10);
  let n=Math.max(1,d20()%6+atkBonus+Math.floor(S.stats.str*0.3));
  if(rightMangled) n=Math.max(1,Math.floor(n*0.4));
  // Critical hit on 20
  if(hit===20){n=Math.floor(n*2.5);msg(`💥 CRITICAL HIT!`);}
  r.enemy.hp=Math.max(0,r.enemy.hp-n);
  if(r.enemy.hp===0){
    let defeated=r.enemy.name;
    // XP reward based on enemy tier
    let dangerXP=Math.pow(S.floor,1.4); // XP scales between loot (1.2) and danger (1.6)
    let xpGain=Math.round(r.enemy.tier==="common"?dangerXP*1.5:r.enemy.tier==="mid"?dangerXP*3:r.enemy.tier==="hard"?dangerXP*6:r.enemy.tier==="elite"?dangerXP*12:dangerXP*25);
    S.xp+=xpGain;
    checkLevelUp();
    r.enemy=null;
    msg(`☠️ ${defeated} is defeated! +${xpGain} XP`);
  } else {
    msg(`⚔️ You hit ${r.enemy.name} for ${n}. (${r.enemy.hp} HP left)`);
    // Enemy attacks back using its atk stat
    let enemyAtk=r.enemy.atk||Math.max(1,d20()%6);
    let incomingDmg=Math.max(1,enemyAtk+d20()%3-1);
    // Element bonus damage
    let elemDmg=r.enemy.elementDmg||0;
    if(elemDmg>0){
      incomingDmg+=elemDmg;
      msg(`🔥 ${r.enemy.element} burns for +${elemDmg} damage!`);
    }
    if(leftMangled) incomingDmg=Math.ceil(incomingDmg*1.5);
    damage(incomingDmg);
  }}
function flee(){
  let r=room();
  if(!r.enemy||r.enemy.hp<=0)return;
  let n=d20();

  // Flee damage scales with danger (floor^1.6) — fleeing deep is risky
  let dangerScale=Math.pow(S.floor,1.6);
  let fleeDmgBase=Math.max(1,Math.round(dangerScale*0.15));
  let fleeDmgHeavy=Math.max(2,Math.round(dangerScale*0.3));
  let d4=1+Math.floor(Math.random()*4); // 1-4 extra randomness

  if(n===20){
    // Critical escape — no damage, return to previous room
    retreatToPrevRoom();
    msg("🏃 Critical escape! You slip away untouched.");
    return;
  }
  if(n<=4){
    // Failed flee — can't escape, enemy counterattacks hard
    let counterDmg=Math.max(1,(r.enemy.atk||fleeDmgHeavy)+d4);
    msg(`🏃 Failed escape! ${r.enemy.name} blocks your retreat and strikes for ${counterDmg}!`);
    damage(counterDmg);
    return;
  }
  if(n<=9){
    // Escape with heavy damage
    let dmg=fleeDmgHeavy+d4;
    retreatToPrevRoom();
    msg(`🏃 You escape but ${r.enemy.name} strikes you for ${dmg} as you flee!`);
    damage(dmg);
    return;
  }
  if(n<=13){
    // Escape with moderate damage
    let dmg=fleeDmgBase+d4;
    retreatToPrevRoom();
    msg(`🏃 You escape with a wound. (${dmg} damage)`);
    damage(dmg);
    return;
  }
  // Clean escape (14-19)
  retreatToPrevRoom();
  msg("🏃 You escape successfully!");
}

function retreatToPrevRoom(){
  // Move back to the room we came from — position changes before render
  if(S.prevX!==undefined&&S.prevY!==undefined){
    S.x=S.prevX;
    S.y=S.prevY;
  }
  save();
}
function act(a){if(S.hp<=0)return;if(a==="search")search();else if(a==="fight")fight();else if(a==="flee")flee();else if(["N","S","E","W"].includes(a))move(a);else if(a==="down")useLadder("down");else if(a==="up")useLadder("up");save();render()}

function useLadder(dir){
  let r=room();
  if(!r.ladder||r.ladder.dir!==dir)return;

  // Mark this ladder as used (green)
  r.ladder.used=true;

  // Save current position for this floor
  if(!S.floorPositions) S.floorPositions={};
  S.floorPositions[S.floor]={x:S.x,y:S.y};

  // Move to target floor
  let targetFloor=dir==="down"?S.floor+1:S.floor-1;
  if(targetFloor<1)return;

  // Check if there's a paired ladder on the target floor
  let targetKey=r.ladder.targetKey;
  S.floor=targetFloor;

  if(targetKey&&S.rooms[targetKey]){
    // Go to the paired ladder room
    let parts=targetKey.split(":");
    S.x=parseInt(parts[1]);
    S.y=parseInt(parts[2]);
    // Mark the paired ladder as used too
    let targetRoom=S.rooms[targetKey];
    if(targetRoom.ladder) targetRoom.ladder.used=true;
  } else if(S.floorPositions[targetFloor]){
    // Return to last known position on that floor
    S.x=S.floorPositions[targetFloor].x;
    S.y=S.floorPositions[targetFloor].y;
  } else {
    // New floor — start at 0,0 and create entry with an up ladder
    S.x=0;S.y=0;
    let newRoom=room();
    let currentRoomKey=key();
    // Place an up-ladder back to where we came from
    let prevKey=`${targetFloor-1}:${S.floorPositions[targetFloor-1]?S.floorPositions[targetFloor-1].x:0}:${S.floorPositions[targetFloor-1]?S.floorPositions[targetFloor-1].y:0}`;
    newRoom.ladder={dir:"up",used:true,targetKey:prevKey};
    // Link the source ladder to this room
    r.ladder.targetKey=currentRoomKey;
  }

  msg(dir==="down"?`🟨 You descend to floor ${S.floor}.`:`🟩 You ascend to floor ${S.floor}.`);
}

function newRun(){localStorage.removeItem(KEY);S=fresh();render()}

function setNickname(val){
  S.nickname=val.trim().slice(0,20);
  save();
}

// --- STAT BOOST PER TURN ---
// After each action, player can pick one stat to boost by 1
// S.statBoostAvailable = true means player hasn't picked yet this turn

function renderStatButtons(){
  let available=S.statBoostAvailable&&S.hp>0;
  return["str","dex","int","cha"].map(k=>{
    if(available){
      return`<div class="stat-btn stat-available" onclick="boostStat('${k}')">${k.toUpperCase()} ${S.stats[k]} <span class="boost-hint">+1</span></div>`;
    }
    return`<div class="stat-btn">${k.toUpperCase()} ${S.stats[k]}</div>`;
  }).join("");
}

function boostStat(stat){
  if(!S.statBoostAvailable||S.hp<=0)return;
  S.stats[stat]+=1;
  S.statBoostAvailable=false;
  save();render();
}
window.boostStat=boostStat;

function toggleCountry(checked){
  if(checked){
    // Detect country via timezone/locale (no external API, privacy-safe)
    try{
      let tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";
      let locale=navigator.language||"en";
      let countryCode=locale.split("-")[1]||tzToCountry(tz)||"";
      S.country=countryCode.toUpperCase();
    }catch(e){
      S.country="";
    }
  } else {
    S.country="";
  }
  save();render();
}

// Map common timezones to country codes (no external API needed)
function tzToCountry(tz){
  const map={"Europe/Stockholm":"SE","Europe/London":"GB","Europe/Berlin":"DE","Europe/Paris":"FR","Europe/Oslo":"NO","Europe/Helsinki":"FI","Europe/Copenhagen":"DK","Europe/Amsterdam":"NL","Europe/Brussels":"BE","Europe/Zurich":"CH","Europe/Vienna":"AT","Europe/Rome":"IT","Europe/Madrid":"ES","Europe/Lisbon":"PT","Europe/Warsaw":"PL","Europe/Prague":"CZ","Europe/Budapest":"HU","Europe/Bucharest":"RO","Europe/Athens":"GR","Europe/Dublin":"IE","America/New_York":"US","America/Chicago":"US","America/Denver":"US","America/Los_Angeles":"US","America/Toronto":"CA","America/Vancouver":"CA","America/Sao_Paulo":"BR","America/Mexico_City":"MX","Asia/Tokyo":"JP","Asia/Seoul":"KR","Asia/Shanghai":"CN","Asia/Kolkata":"IN","Asia/Singapore":"SG","Australia/Sydney":"AU","Australia/Melbourne":"AU","Pacific/Auckland":"NZ"};
  return map[tz]||"";
}

// Convert country code to flag emoji
function countryFlag(code){
  if(!code||code.length!==2)return"🌍";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6+c.charCodeAt(0)-65));
}

window.setNickname=setNickname;
window.toggleCountry=toggleCountry;

// --- MAP RENDERING: Grid of rectangular boxes ---
function drawMap(){
  let minX=S.x, maxX=S.x, minY=S.y, maxY=S.y;
  for(let k of Object.keys(S.rooms)){
    let parts=k.split(":");
    if(parseInt(parts[0])!==S.floor) continue;
    let rx=parseInt(parts[1]), ry=parseInt(parts[2]);
    minX=Math.min(minX,rx); maxX=Math.max(maxX,rx);
    minY=Math.min(minY,ry); maxY=Math.max(maxY,ry);
  }
  minX-=1; maxX+=1; minY-=1; maxY+=1;

  let viewSize=11;
  if(maxX-minX+1>viewSize){
    minX=S.x-Math.floor(viewSize/2);
    maxX=S.x+Math.floor(viewSize/2);
  }
  if(maxY-minY+1>viewSize){
    minY=S.y-Math.floor(viewSize/2);
    maxY=S.y+Math.floor(viewSize/2);
  }

  let cols=maxX-minX+1;
  let html=`<div class="dungeon-grid" style="grid-template-columns:repeat(${cols},1fr)">`;

  for(let y=minY;y<=maxY;y++){
    for(let x=minX;x<=maxX;x++){
      let rk=`${S.floor}:${x}:${y}`;
      let rm=S.rooms[rk];
      let isPlayer=(x===S.x&&y===S.y);

      if(!rm&&!isPlayer){
        html+=`<div class="map-cell unexplored"></div>`;
      } else {
        let symbol="";
        let cellClass="map-cell explored";

        if(isPlayer){
          symbol="◎";
          cellClass+=" player";
        } else if(rm.enemy&&rm.enemy.hp>0){
          symbol="⚔";
          cellClass+=" enemy";
        } else if(rm.npc){
          symbol="🔵";
          cellClass+=" npc";
        } else if(rm.trader){
          symbol="💲";
          cellClass+=" trader";
        } else if(rm.ladder&&rm.ladder.dir==="down"){
          symbol=rm.ladder.used?"🪜↓":"🪜↓";
          cellClass+=rm.ladder.used?" ladder-used":" ladder-down";
        } else if(rm.ladder&&rm.ladder.dir==="up"){
          symbol=rm.ladder.used?"🪜↑":"🪜↑";
          cellClass+=rm.ladder.used?" ladder-used":" ladder-up";
        } else if(rm.secret){
          symbol="✦";
          cellClass+=" secret";
        } else if(rm.rest&&!rm.rest.depleted){
          symbol="💚";
          cellClass+=" rest-source";
        } else {
          symbol="·";
          cellClass+=" visited";
        }

        let borders="";
        if(rm){
          if(rm.blocked.N) borders+=" blocked-n";
          if(rm.blocked.S) borders+=" blocked-s";
          if(rm.blocked.E) borders+=" blocked-e";
          if(rm.blocked.W) borders+=" blocked-w";
        }

        html+=`<div class="${cellClass}${borders}"><span class="map-symbol">${symbol}</span></div>`;
      }
    }
  }
  html+=`</div>`;
  return html;
}

function render(){
  let r=room();
  intro.textContent=`${S.name} · Floor ${S.floor}`;
  // Sync nickname input (don't overwrite if user is typing)
  let ni=document.getElementById("nicknameInput");
  if(ni&&document.activeElement!==ni) ni.value=S.nickname||"";
  let sc=document.getElementById("showCountry");
  if(sc) sc.checked=!!(S.country);
  stats.innerHTML=[`❤️ HP ${Math.max(0,S.hp)}/${S.maxHp}`,`⭐ Level ${S.level}`,`XP ${S.xp}`,`🍀 Luck ${S.stats.luck||0}`].map(x=>`<div>${x}</div>`).join("")+renderStatButtons()+`<div>💰 ${S.gold}</div>`;
  roomTitle.textContent=`Floor ${S.floor} — Chamber`;
  roomText.textContent=r.enemy&&r.enemy.hp>0?`⚔️ ${r.enemy.name} (${r.enemy.hp} HP)${r.enemy.element?` [${r.enemy.element}]`:""} blocks the chamber.`:r.npc&&!r.npc.completed?`🔵 ${r.npc.name}, ${r.npc.title}, is here.`:r.trader?`💲 ${r.trader.name}, ${r.trader.title}, awaits.`:r.rest&&!r.rest.depleted?`${r.rest.emoji} A ${r.rest.name} flows here. (${r.rest.sips} sips remain)`:"The chamber is quiet.";
  map.innerHTML=drawMap();
  if(r.enemy&&r.enemy.hp>0){
    actions.innerHTML=`<div class="combat-actions"><button onclick="act('fight')">⚔️ Fight (F)</button><button onclick="act('flee')">🏃 Flee (R)</button></div>`;
  } else {
    let extras="";
    if(!r.searched) extras+=`<button class="action-btn" onclick="act('search')">🔎 Search (E)</button>`;
    if(r.npc&&!r.npc.completed) extras+=`<button class="action-btn npc-btn" onclick="talkNPC()">🔵 Talk (T)</button>`;
    if(r.trader) extras+=`<button class="action-btn trader-btn" onclick="talkTrader()">💲 Trade (T)</button>`;
    if(r.rest&&!r.rest.depleted) extras+=`<button class="action-btn ${r.rest.type==="luck"?"luck-btn":"rest-btn"}" onclick="useRest()">${r.rest.type==="luck"?"🍀":"💚"} ${r.rest.name} (${r.rest.sips}/${r.rest.maxSips})</button>`;
    if(r.ladder) extras+=`<button class="action-btn" onclick="act('${r.ladder.dir}')">🪜 ${r.ladder.dir==="down"?"↓ Descend":"↑ Ascend"}</button>`;
    actions.innerHTML=`<div class="compass">
      <div class="compass-row"><button class="compass-btn north${r.blocked&&r.blocked.N?" blocked":""}" onclick="act('N')"${r.blocked&&r.blocked.N?" disabled":""}>▲<br><span>W / ↑</span></button></div>
      <div class="compass-row middle"><button class="compass-btn west${r.blocked&&r.blocked.W?" blocked":""}" onclick="act('W')"${r.blocked&&r.blocked.W?" disabled":""}>◀<br><span>A / ←</span></button><div class="compass-center">◎</div><button class="compass-btn east${r.blocked&&r.blocked.E?" blocked":""}" onclick="act('E')"${r.blocked&&r.blocked.E?" disabled":""}>▶<br><span>D / →</span></button></div>
      <div class="compass-row"><button class="compass-btn south${r.blocked&&r.blocked.S?" blocked":""}" onclick="act('S')"${r.blocked&&r.blocked.S?" disabled":""}>▼<br><span>S / ↓</span></button></div>
    </div>${extras?`<div class="extra-actions">${extras}</div>`:""}`;
  }
  if(S.hp<=0)actions.innerHTML="☠️ Dead — press New Run.";
  log.innerHTML=S.log.map(x=>`<div>${x}</div>`).join("");
  equipment.innerHTML=["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].map(k=>{
    let disabled=(k==="weapon"&&S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5);
    return`<div class=card><b>${k.toUpperCase()}</b>${disabled?`<div class="small lost-finger">⚠️ Right hand mangled — cannot wield</div>`:S.equipment[k]?item(S.equipment[k],false,k):"<div class=small>Empty</div>"}</div>`;
  }).join("")+`<div class=card><b>RINGS — Left Hand 🫲</b><div class=grid>${S.equipment.rings.slice(0,5).map((x,i)=>{
    if(isFingerLost(i)) return`<div class="item lost-finger">❌ ${i+1}. Lost</div>`;
    return x?item(x,false,"ring"+i):`<div class=item>${i+1}. Empty</div>`;
  }).join("")}</div>${S.lostFingers&&S.lostFingers.left&&S.lostFingers.left.length>=5?`<div class="small lost-finger">⚠️ Left hand mangled — no shield grip</div>`:""}</div><div class=card><b>RINGS — Right Hand 🫱</b><div class=grid>${S.equipment.rings.slice(5).map((x,i)=>{
    if(isFingerLost(i+5)) return`<div class="item lost-finger">❌ ${i+1}. Lost</div>`;
    return x?item(x,false,"ring"+(i+5)):`<div class=item>${i+1}. Empty</div>`;
  }).join("")}</div>${S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5?`<div class="small lost-finger">⚠️ Right hand mangled — no weapon grip</div>`:""}</div>`;
  inventory.innerHTML=S.inventory.length?S.inventory.map(x=>item(x,true,false)).join(""):"<div class=small>Empty</div>";
  quests.innerHTML=S.quests.length?S.quests.map(q=>{
    let floorHint=q.targetFloor?`Floor ${q.targetFloor}`:(q.difficulty||"?");
    let onCorrectFloor=q.targetFloor===S.floor;
    return`<div class="card quest-card ${q.found?"quest-found":""}${!q.found&&onCorrectFloor?" quest-active":""}">
      ${q.found?"✅":"🔎"} <b>${q.itemName}</b>
      <div class="small">${q.found?"Found — return to "+q.npcName+"!":`Search on: ${floorHint}${onCorrectFloor?" ← YOU ARE HERE":""}`} · Reward: ${q.xpReward} XP${q.itemReward?" + 🎁":""}
      </div></div>`;
  }).join(""):"<div class=small>No active quests.</div>";
  renderHall();
}

// --- INIT ---
window.act=act;window.equip=equip;window.unequip=unequip;window.discard=discard;window.discardChoice=discardChoice;window.swapRing=swapRing;window.newRun=newRun;window.talkNPC=talkNPC;window.talkTrader=talkTrader;window.sellItem=sellItem;

// --- KEYBOARD CONTROLS ---
document.addEventListener("keydown",(e)=>{
  // Don't trigger if a modal is open
  if(document.getElementById("discardModal")||document.getElementById("ringSwapModal")||document.getElementById("traderModal"))return;
  if(S.hp<=0)return;

  let r=room();
  let inCombat=r.enemy&&r.enemy.hp>0;

  switch(e.key){
    // WASD + Arrow keys for movement
    case"w":case"W":case"ArrowUp":
      if(!inCombat)act("N");e.preventDefault();break;
    case"a":case"A":case"ArrowLeft":
      if(!inCombat)act("W");e.preventDefault();break;
    case"s":case"S":case"ArrowDown":
      if(!inCombat)act("S");e.preventDefault();break;
    case"d":case"D":case"ArrowRight":
      if(!inCombat)act("E");e.preventDefault();break;
    // Combat keys
    case"f":case"F":
      if(inCombat)act("fight");break;
    case"r":case"R":
      if(inCombat)act("flee");break;
    // Search
    case"e":case"E":
      if(!inCombat)act("search");break;
    // Talk to NPC / Trader
    case"t":case"T":
      if(!inCombat){
        if(r.npc&&!r.npc.completed) talkNPC();
        else if(r.trader) talkTrader();
      }
      break;
  }
});

render();
fetchGlobalHall(); // Fetch global leaderboard on page load
