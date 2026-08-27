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
  amulet:["Stone Amulet","Moon Amulet","Dragon Tooth Pendant","Deepforge Medallion","Crystal Heart Necklace","Shadow Locket","Titan Torc","Obsidian Charm","Flame Pearl Amulet","Runed Gorget","Ancient Talisman","Bone Relic Chain","Stormstone Pendant","Void Eye Amulet"],
  ring:["Iron Ring","Moonstone Ring","Bone Ring","Ember Ring","Dwarven Signet","Crystal Band","Shadow Loop","Titan Seal","Dragon Coil","Obsidian Circle","Flame Spark Ring","Runed Band","Ancient Vow Ring","Void Touch Ring","Deepforge Signet","Stormcaller Ring","Frozen Tear Ring","Goldheart Band","Spirit Whisper Ring","Bloodstone Ring"]
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
  ring:["💍","💎","🔴","🔵","🟡","⚪","🟢","🟣","🪨","✨","🖤","❤️"]
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
const rar=["common","uncommon","rare","mythical"], dep=["bronze","silver","gold","titan","glowing"];
let S=JSON.parse(localStorage.getItem(KEY)||"null")||fresh();
let globalHall=[]; // Cached global leaderboard from D1

function fresh(){return{name:dwarves[Math.floor(Math.random()*dwarves.length)],nickname:"",level:1,xp:0,hp:10,maxHp:10,floor:1,x:0,y:0,gold:0,stats:{str:1,dex:1,int:1,cha:1},rooms:{"1:0:0":{searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null}},inventory:[],equipment:{weapon:null,helmet:null,armor:null,boots:null,shoulders:null,trousers:null,cape:null,amulet:null,rings:Array(10).fill(null)},lostFingers:{left:[],right:[]},quests:[],log:[`📖 ${intros[Math.floor(Math.random()*intros.length)]}`]}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function key(){return`${S.floor}:${S.x}:${S.y}`}
function room(){return S.rooms[key()]||(S.rooms[key()]={searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null})}
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
    name:names[type][Math.floor(Math.random()*names[type].length)],
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
  if(Math.random()<traitChance){
    i.trait=traits[Math.floor(Math.random()*traits.length)];
  }
  // Rare chance of DOUBLE trait on mythical
  if(r===3&&Math.random()<0.15){
    let second=traits[Math.floor(Math.random()*traits.length)];
    if(second!==i.trait) i.trait=i.trait+", "+second;
  }

  return i;
}
function slot(i){return i.type==="ring"?"rings":i.type}

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
    items:countItems()
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
    <b>${x.nickname||"Secret Hero"}</b> — ${x.name}
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

function spawnNPC(){
  let name=npcNames[Math.floor(Math.random()*npcNames.length)];
  let title=npcTitles[Math.floor(Math.random()*npcTitles.length)];
  let questItem=questItems[Math.floor(Math.random()*questItems.length)];

  // Difficulty scales with floor — deeper floors give harder quests with better rewards
  let diffRoll=Math.random();
  let diff=diffRoll<0.4?"nearby":diffRoll<0.7?"moderate":diffRoll<0.9?"distant":"legendary";

  // XP reward scales with difficulty and floor (exponential like danger)
  let dangerScale=Math.pow(S.floor,1.6);
  let baseXP=diff==="nearby"?Math.round(dangerScale*0.5+20):
             diff==="moderate"?Math.round(dangerScale*1.2+50):
             diff==="distant"?Math.round(dangerScale*2.5+100):
             Math.round(dangerScale*5+250);

  // Item reward chance (better quests might give equipment)
  let itemReward=null;
  if(diff==="legendary"||(diff==="distant"&&Math.random()<0.4)){
    itemReward=true; // Will generate an item on delivery
  }

  // Hint about where to find it
  let hint=diff==="nearby"?"It should be somewhere on this floor.":
           diff==="moderate"?"You may need to explore deeper.":
           diff==="distant"?"It lies far below, in the deep dark.":
           "It is said to exist only in the most ancient depths.";

  return{name,title,questItem,xpReward:baseXP,difficulty:diff,hint,itemReward,completed:false};
}

function talkNPC(){
  let r=room();
  if(!r.npc||r.npc.completed)return;

  // Check if player has the quest item already
  let existingQuest=S.quests.find(q=>q.itemName===r.npc.questItem&&q.found);
  if(existingQuest){
    deliverQuest(r.npc,existingQuest);
    return;
  }

  // Check if quest is already active
  let active=S.quests.find(q=>q.itemName===r.npc.questItem);
  if(active){
    msg(`🔵 ${r.npc.name} says: "Still searching for the ${r.npc.questItem}? ${r.npc.hint}"`);
    return;
  }

  // Give new quest
  let quest={
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

  // Award item if applicable
  if(quest.itemReward){
    let rewardItem=makeItem(types[Math.floor(Math.random()*types.length)]);
    // Quest reward items are at least uncommon and get a bonus
    if(rewardItem.rarity==="common") rewardItem.rarity="uncommon";
    // Boost stats by 30-80%
    let boost=1.3+Math.random()*0.5;
    for(let k in rewardItem.stats) rewardItem.stats[k]=Math.round(rewardItem.stats[k]*boost);
    // Ensure a trait
    if(!rewardItem.trait) rewardItem.trait=traits[Math.floor(Math.random()*traits.length)];
    msg(`🎁 ${npc.name} rewards you with: ${rewardItem.name}! ${obtain(rewardItem)}`);
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
  let activeQuests=S.quests.filter(qq=>!qq.found);
  if(activeQuests.length>0){
    let searchRoll=d20();
    // Base find chance depends on quest difficulty and floors explored since quest start
    let quest=activeQuests[Math.floor(Math.random()*activeQuests.length)];
    let floorsSearched=Math.abs(S.floor-quest.npcFloor);
    let findThreshold=quest.difficulty==="nearby"?8:quest.difficulty==="moderate"?12:quest.difficulty==="distant"?15:18;
    // Bonus from floors explored (deeper = more likely to find distant items)
    findThreshold-=Math.min(5,floorsSearched);
    // INT bonus
    findThreshold-=Math.floor(S.stats.int/20);

    if(searchRoll===20){
      // CRITICAL SUCCESS — find quest item + bonus
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

  // --- NORMAL SEARCH RESULTS ---
  let q=Math.random();
  if(q<.12){r.secret={dir:["N","E","S","W"][Math.floor(Math.random()*4)]};msg("✨ A secret passage is revealed!");return}
  if(q<.40){let i=makeItem(types[Math.floor(Math.random()*types.length)]);msg(`🎁 ${i.name} found. ${obtain(i)}`);return}
  if(q<.52){msg("⚠️ A hidden trap strikes!");damage(Math.max(1,Math.round(Math.pow(S.floor,1.2)*0.2)));if(Math.random()<0.12)loseFinger();return}
  msg("🔎 You find nothing of interest.");}

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
  }

  save();render();
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
    let xpGain=r.enemy.tier==="common"?5+S.floor:r.enemy.tier==="mid"?15+S.floor*2:r.enemy.tier==="hard"?40+S.floor*3:r.enemy.tier==="elite"?100+S.floor*5:250+S.floor*10;
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
function flee(){let r=room();if(!r.enemy||r.enemy.hp<=0)return;let n=d20();if(n===20)return msg("🏃 Critical escape! No consequence.");if(n<=4){msg("🏃 Failed escape! The foe counterattacks.");damage(Math.max(1,d20()%5+1));return}if(n<=9){msg("🏃 You escape but take damage.");damage(Math.max(1,d20()%4+1));return}if(n<=13){msg("🏃 You escape but suffer a lingering consequence.");damage(1);return}msg("🏃 You escape successfully.")}
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
  stats.innerHTML=[`❤️ HP ${Math.max(0,S.hp)}/${S.maxHp}`,`⭐ Level ${S.level}`,`XP ${S.xp}`,`STR ${S.stats.str}`,`DEX ${S.stats.dex}`,`INT ${S.stats.int}`,`CHA ${S.stats.cha}`,`💰 ${S.gold}`].map(x=>`<div>${x}</div>`).join("");
  roomTitle.textContent=`Floor ${S.floor} — Chamber`;
  roomText.textContent=r.enemy&&r.enemy.hp>0?`⚔️ ${r.enemy.name} (${r.enemy.hp} HP)${r.enemy.element?` [${r.enemy.element}]`:""} blocks the chamber.`:r.npc&&!r.npc.completed?`🔵 ${r.npc.name}, ${r.npc.title}, is here.`:r.trader?`💲 ${r.trader.name}, ${r.trader.title}, awaits.`:"The chamber is quiet.";
  map.innerHTML=drawMap();
  if(r.enemy&&r.enemy.hp>0){
    actions.innerHTML=`<div class="combat-actions"><button onclick="act('fight')">⚔️ Fight (F)</button><button onclick="act('flee')">🏃 Flee (R)</button></div>`;
  } else {
    let extras="";
    if(!r.searched) extras+=`<button class="action-btn" onclick="act('search')">🔎 Search (E)</button>`;
    if(r.npc&&!r.npc.completed) extras+=`<button class="action-btn npc-btn" onclick="talkNPC()">🔵 Talk (T)</button>`;
    if(r.trader) extras+=`<button class="action-btn trader-btn" onclick="talkTrader()">💲 Trade (T)</button>`;
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
  }).join("")+`<div class=card><b>RINGS — Left Hand 🤚</b><div class=grid>${S.equipment.rings.slice(0,5).map((x,i)=>{
    if(isFingerLost(i)) return`<div class="item lost-finger">❌ ${i+1}. Lost</div>`;
    return x?item(x,false,"ring"+i):`<div class=item>${i+1}. Empty</div>`;
  }).join("")}</div>${S.lostFingers&&S.lostFingers.left&&S.lostFingers.left.length>=5?`<div class="small lost-finger">⚠️ Left hand mangled — no shield grip</div>`:""}</div><div class=card><b>RINGS — Right Hand ✋</b><div class=grid>${S.equipment.rings.slice(5).map((x,i)=>{
    if(isFingerLost(i+5)) return`<div class="item lost-finger">❌ ${i+1}. Lost</div>`;
    return x?item(x,false,"ring"+(i+5)):`<div class=item>${i+1}. Empty</div>`;
  }).join("")}</div>${S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5?`<div class="small lost-finger">⚠️ Right hand mangled — no weapon grip</div>`:""}</div>`;
  inventory.innerHTML=S.inventory.length?S.inventory.map(x=>item(x,true,false)).join(""):"<div class=small>Empty</div>";
  quests.innerHTML=S.quests.length?S.quests.map(q=>{
    let diffIcon=q.difficulty==="nearby"?"⚪":q.difficulty==="moderate"?"🔵":q.difficulty==="distant"?"🟠":"🟣";
    return`<div class="card quest-card ${q.found?"quest-found":""}">
      ${q.found?"✅":"🔎"} <b>${q.itemName}</b> ${diffIcon} ${q.difficulty||""}
      <div class="small">${q.found?"Found — return to NPC!":"Searching..."} · Reward: ${q.xpReward} XP${q.itemReward?" + 🎁":""}
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
