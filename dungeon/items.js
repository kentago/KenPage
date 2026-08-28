// --- ITEM SYSTEM ---
let pendingItem=null; // item waiting for discard decision

// --- PRESTIGE TIER (floor 250+ only) ---
// The ultimate endgame rarity. Only items found at floor 250+ can roll it.
// Applied as a full-card cosmic effect, NOT a third border (keeps UI to 2 borders max).
// Tiers: "eternal" (250+), "cosmic" (350+), "genesis" (500+) — increasingly rare.
function rollPrestige(){
  if(S.floor<250) return null;
  let z=Math.random();
  // Base ~2% at floor 250, scaling up with depth
  let chance=Math.min(0.15,0.02+(S.floor-250)*0.0004);
  if(z>chance) return null;
  // Which prestige tier
  let t=Math.random();
  if(S.floor>=500&&t<0.15) return "genesis";
  if(S.floor>=350&&t<0.40) return "cosmic";
  return "eternal";
}

// --- EFFECTIVE STATS ---
// Sums base stats + all equipped item stats + parsed trait bonuses (incl. luck).
// All game mechanics should read from eff() rather than S.stats directly.
function eff(){
  let e={str:S.stats.str||0,dex:S.stats.dex||0,int:S.stats.int||0,cha:S.stats.cha||0,luck:S.stats.luck||0};

  // Count equipped rings (for "per ring worn" traits)
  let ringCount=S.equipment.rings.filter(x=>x).length;

  // Gather all equipped items
  let equipped=[];
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{
    if(S.equipment[k]) equipped.push(S.equipment[k]);
  });
  S.equipment.rings.forEach(x=>{if(x)equipped.push(x);});

  for(let it of equipped){
    // Add raw item stats
    if(it.stats){
      for(let k in it.stats){ if(e[k]!==undefined) e[k]+=it.stats[k]; }
    }
    // Parse trait bonuses (traits are strings that may contain stat effects)
    if(it.trait){
      let traits=it.trait.split(",").map(t=>t.trim());
      for(let t of traits) applyTraitBonus(t,e,ringCount);
    }
  }
  return e;
}

// Parse a single trait string and apply its numeric bonus to the effective stats
function applyTraitBonus(trait,e,ringCount){
  // Flat luck bonuses
  if(/Fortune's Favor/.test(trait)) e.luck+=2;
  if(/Dwarf's Blessing/.test(trait)) e.luck+=3;
  if(/Fortune's Heart/.test(trait)) e.luck+=3;
  if(/Luck of the Ancients/.test(trait)) e.luck+=5;
  if(/Lucky Star/.test(trait)) e.luck+=2;
  // Per-ring-worn bonuses
  if(/Serendipity/.test(trait)) e.luck+=ringCount;
  if(/Gemlink/.test(trait)) e.str+=ringCount;
  if(/Jeweler's Pride/.test(trait)) e.dex+=ringCount;
  if(/Ringmaster/.test(trait)) e.int+=ringCount;
  if(/Crown of Fingers/.test(trait)) e.cha+=ringCount;
  // Set bonuses
  if(/Constellation/.test(trait)&&ringCount>=8){e.str++;e.dex++;e.int++;e.cha++;}
  if(/Perfect Ten/.test(trait)&&ringCount>=10){e.str+=5;e.dex+=5;e.int+=5;e.cha+=5;}
  if(/Dwarf King's Legacy/.test(trait)){let b=Math.floor(ringCount/5);e.str+=b;e.dex+=b;e.int+=b;e.cha+=b;}
  // Amulet all-stat
  if(/Dwarven Ancestry/.test(trait)){e.str++;e.dex++;e.int++;e.cha++;}
  if(/Deep Sight/.test(trait)) e.int+=3;
}

function makeItem(type){
  // --- SCALING: Loot quality grows SLOWER than danger ---
  // Loot power ≈ floor^1.2 (exploring current floor makes you stronger before descending)
  let lootScale=Math.pow(S.floor,1.2)+S.level*0.5;

  // --- RARITY ROLL (7 tiers) ---
  // Deeper floors shift odds toward higher rarities. Common still dominates early.
  // depthShift grows slowly with floor (caps so it never fully removes commons).
  let ds=Math.min(0.45,S.floor*0.004); // 0 at floor 1, ~0.45 by floor 110+
  let z=Math.random()+ds; // shift the roll upward at depth
  let r;
  if(z<0.62) r=0;        // common
  else if(z<0.85) r=1;   // uncommon
  else if(z<0.95) r=2;   // rare
  else if(z<0.985) r=3;  // epic
  else if(z<0.997) r=4;  // mythical
  else if(z<0.9995) r=5; // legendary
  else r=6;              // divine
  r=Math.min(r,rar.length-1);

  // --- DEPTH TIER ROLL (8 tiers) ---
  // Floor sets the max reachable tier; odds shift toward higher tiers at depth.
  let maxDepth=Math.min(dep.length-1,Math.floor((S.floor-1)/8)+1);
  let dz=Math.random()+Math.min(0.4,S.floor*0.0035);
  let depIdx;
  if(dz<0.62) depIdx=0;      // bronze (no border)
  else if(dz<0.80) depIdx=1; // silver
  else if(dz<0.90) depIdx=2; // gold
  else if(dz<0.955) depIdx=3;// titan
  else if(dz<0.982) depIdx=4;// platinum
  else if(dz<0.995) depIdx=5;// glowing
  else if(dz<0.9992) depIdx=6;// prismatic
  else depIdx=7;             // astral
  depIdx=Math.min(depIdx,maxDepth);

  let i={
    id:crypto.randomUUID(),
    type,
    name:(type==="ring"||type==="amulet")?`${questPrefixes[Math.floor(Math.random()*questPrefixes.length)]} ${names[type][Math.floor(Math.random()*names[type].length)]}`:names[type][Math.floor(Math.random()*names[type].length)],
    rarity:rar[r],
    depth:dep[depIdx],
    art:arts[type][Math.floor(Math.random()*arts[type].length)],
    stats:{},
    trait:null,
    prestige:rollPrestige()
  };

  // --- STAT GENERATION ---
  // Primary stat uses lootScale (grows as floor^1.2)
  let p=["str","dex","int","cha"];
  let primary=p[Math.floor(Math.random()*4)];

  // Wide variance: 0.4x to 1.6x
  let variance=0.4+Math.random()*1.2;
  let primaryVal=Math.max(1,Math.round(lootScale*variance));

  // Rarity multiplier — higher tiers get WIDER variance (not strictly higher, per spec)
  // Scales across all 7 tiers; top tiers can roll big but also modest.
  let rarMult=0.6+r*0.15+Math.random()*(0.6+r*0.25);
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
  let traitChance=0.08+r*0.08+Math.min(0.2,S.floor*0.003);
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
  // Rare chance of DOUBLE trait on epic+ (r>=3)
  if(r>=3&&Math.random()<0.15+r*0.03){
    let pool=type==="ring"&&Math.random()<0.5?ringTraits:type==="amulet"&&Math.random()<0.5?amuletTraits:traits;
    let second=pool[Math.floor(Math.random()*pool.length)];
    if(second!==i.trait) i.trait=i.trait+", "+second;
  }

  return i;
}
function slot(i){return i.type==="ring"?"rings":i.type}

// --- LEGENDARY ITEM GENERATION (critical success d20=20) ---
// These are unique, powerful items that feel like "no one else has found this"

function makeLegendaryItem(){
  let type=types[Math.floor(Math.random()*types.length)];
  let lootScale=Math.pow(S.floor,1.2)+S.level*0.5;

  // High rarity — epic/mythical/legendary/divine, skewing higher with floor
  let rz=Math.random()+Math.min(0.3,S.floor*0.003);
  let r;
  if(rz<0.35) r=3;       // epic
  else if(rz<0.70) r=4;  // mythical
  else if(rz<0.93) r=5;  // legendary
  else r=6;              // divine
  r=Math.min(r,rar.length-1);

  // Legendary items skew toward higher depth tiers (they're the flashy finds)
  let maxDepth=Math.min(dep.length-1,Math.floor((S.floor-1)/8)+2);
  let dz=Math.random();
  let depIdx;
  if(dz<0.12) depIdx=2;      // gold
  else if(dz<0.35) depIdx=3; // titan
  else if(dz<0.58) depIdx=4; // platinum
  else if(dz<0.82) depIdx=5; // glowing
  else if(dz<0.95) depIdx=6; // prismatic
  else depIdx=7;             // astral
  depIdx=Math.min(depIdx,maxDepth);
  depIdx=Math.min(depIdx,maxDepth);

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
    trait:null,
    prestige:rollPrestige()
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
  let dead=S.hp<=0;
  let buttons="";
  let val=itemValue(i);
  if(!dead){
    if(inv){
      buttons+=`<button onclick="equip('${i.id}')">⬆️ Equip</button><button onclick="discard('${i.id}')">🗑️ Drop</button>`;
      // Sell direct from inventory ONLY when standing at a trader
      let r=room();
      if(r&&r.trader) buttons+=`<button onclick="sellFromInventory('${i.id}')">💰 Sell ${val}</button>`;
    }
    if(equipped) buttons+=`<button onclick="unequip('${i.id}','${equipped}')">⬇️ Unequip</button>`;
  }
  return`<div class="item ${i.rarity} ${i.depth}${i.prestige?" prestige-"+i.prestige:""}"><span class="art">${i.art}</span><b>${i.name}</b><div>${Object.entries(i.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>${i.trait?`<div class="trait">⚡ ${i.trait}</div>`:""}<div class="small">${i.rarity[0].toUpperCase()+i.rarity.slice(1)} · ${i.depth[0].toUpperCase()+i.depth.slice(1)}${i.prestige?` · ✦${i.prestige[0].toUpperCase()+i.prestige.slice(1)}✦`:""} · 💰 ${val}</div>${buttons}</div>`;
}

// Sell value of an item (CHA-boosted, same formula as trader modal)
function itemValue(x){
  let chaBonus=1+(eff().cha||1)*0.03;
  return Math.max(1,Math.floor(((Object.values(x.stats).reduce((a,b)=>a+b,0))*2+(rar.indexOf(x.rarity)+1)*5)*chaBonus));
}

// Sell an inventory item directly (only valid at a trader)
function sellFromInventory(id){
  let r=room();
  if(!r||!r.trader){ msg("💲 You can only sell at a trader."); return; }
  let n=S.inventory.findIndex(x=>x.id===id);
  if(n<0)return;
  let it=S.inventory[n];
  let val=itemValue(it);
  S.inventory.splice(n,1);
  S.gold=(S.gold||0)+val;
  msg(`💰 Sold ${it.name} for ${val} gold.`);
  save();render();
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
