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

// --- LUCK → CHANCE (asymptotic, endless-friendly) ---
// Converts a Luck value into a probability that APPROACHES `limit` but NEVER reaches
// it, so every extra luck point always helps a little (diminishing returns) and no
// outcome is ever guaranteed — the right feel for an endless dungeon.
//   chance = base + (limit - base) * luck/(luck + k)
// base = chance at 0 luck; k = how fast it climbs (smaller = faster). limit default 0.90.
function luckChance(luck, base, k, limit){
  luck=Math.max(0,luck||0);
  if(limit===undefined) limit=0.90;
  return base + (limit - base) * (luck/(luck + k));
}

// Split an item's trait string into individual traits. Multiple traits are joined
// with ", " but each trait's DESCRIPTION can also contain commas (e.g. "Thunderstrike
// (+shock damage, scales w/ floor)"). So we split ONLY on commas that are OUTSIDE
// parentheses — never breaking a description into a fake extra trait.
function splitTraits(traitStr){
  if(!traitStr) return [];
  let out=[], depth=0, cur="";
  for(let ch of traitStr){
    if(ch==="(") depth++;
    else if(ch===")") depth=Math.max(0,depth-1);
    if(ch==="," && depth===0){ out.push(cur.trim()); cur=""; }
    else cur+=ch;
  }
  if(cur.trim()) out.push(cur.trim());
  return out.filter(t=>t&&t!=="null");
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
      let traits=splitTraits(it.trait);
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
  // Set bonuses (ring-count gated) — scale the all-stat payout gently with level
  // via allMult so they stay relevant late-game without exploding.
  let lvl=S.level||1;
  let allMult=Math.ceil(lvl/10); // 1 at lvl 1-10, 2 at 11-20 ... 5 at 41-50
  if(/Constellation/.test(trait)&&ringCount>=8){e.str+=allMult;e.dex+=allMult;e.int+=allMult;e.cha+=allMult;}
  if(/Perfect Ten/.test(trait)&&ringCount>=10){e.str+=5*allMult;e.dex+=5*allMult;e.int+=5*allMult;e.cha+=5*allMult;}
  if(/Dwarf King's Legacy/.test(trait)){let b=Math.floor(ringCount/5)*allMult;e.str+=b;e.dex+=b;e.int+=b;e.cha+=b;}
  // Amulet all-stat
  if(/Dwarven Ancestry/.test(trait)){e.str+=allMult;e.dex+=allMult;e.int+=allMult;e.cha+=allMult;}
  // Single-stat: scales +N per LEVEL (like Runic Surge) so it stays meaningful at depth.
  if(/Deep Sight/.test(trait)) e.int+=3*lvl;
  // Soul Keeper — defensive proxy: all stats, gently level-scaled (+3×allMult each)
  if(/Soul Keeper/.test(trait)){e.str+=3*allMult;e.dex+=3*allMult;e.int+=3*allMult;e.cha+=3*allMult;}
  // Former flavor traits — stat bonuses
  if(/Grave Fortune/.test(trait)) e.luck+=2;
  if(/Deep Luck/.test(trait)) e.luck+=2;
  // Runic Surge — single-stat, scales with level: +2 INT per level
  // (level 1 = +2, level 50 = +100). Encourages swapping/rerolling toward it at depth.
  if(/Runic Surge/.test(trait)) e.int+=2*lvl;
  // All-stat blessings — gentle level scaling (×allMult per stat).
  if(/Ancient Blessing/.test(trait)){e.str+=allMult;e.dex+=allMult;e.int+=allMult;e.cha+=allMult;}
  if(/Soulbound/.test(trait)){e.str+=2*allMult;e.dex+=2*allMult;e.int+=2*allMult;e.cha+=2*allMult;}
}

// Returns true if any equipped item has a trait matching the given name (substring match)
function hasTrait(name){
  let equipped=[];
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{
    if(S.equipment[k]) equipped.push(S.equipment[k]);
  });
  S.equipment.rings.forEach(x=>{if(x)equipped.push(x);});
  return equipped.some(it=>it.trait&&it.trait.includes(name));
}

// Counts how many EQUIPPED items carry a "-25% damage taken" defensive trait.
// Each one stacks multiplicatively (25% off whatever damage remains), so this
// count drives 0.75^count in combat. Multiple copies of the same trait name on
// different items all count — 4 defensive rings = 4 stacks (capped in combat).
function countDefensiveWards(){
  let defensiveTraits=["Iron Will","Stoneguard","Obsidian Shell","Dwarven Fortitude"];
  let equipped=[];
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{
    if(S.equipment[k]) equipped.push(S.equipment[k]);
  });
  S.equipment.rings.forEach(x=>{if(x)equipped.push(x);});
  let count=0;
  for(let it of equipped){
    if(!it.trait) continue;
    // A single item could theoretically carry two defensive traits (double-trait
    // epics) — count each matching trait so it contributes its own stack.
    for(let t of defensiveTraits){ if(it.trait.includes(t)) count++; }
  }
  return count;
}

// Like hasTrait, but for the ring "Finger Ward" specifically — excludes "Finger Ward Amulet".
function hasTraitExact(name){
  let equipped=[];
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{
    if(S.equipment[k]) equipped.push(S.equipment[k]);
  });
  S.equipment.rings.forEach(x=>{if(x)equipped.push(x);});
  return equipped.some(it=>{
    if(!it.trait) return false;
    // match "Finger Ward" but NOT "Finger Ward Amulet"
    return it.trait.includes(name)&&!it.trait.includes(name+" Amulet");
  });
}

// --- EFFECTIVE MAX HP ---
// Base S.maxHp (grows from level-ups) plus trait-granted HP bonuses.
// Use this everywhere healing is capped or HP is displayed so HP-granting
// traits actually raise the ceiling.
function effMaxHp(){
  let hp=S.maxHp;
  let ringCount=S.equipment.rings.filter(x=>x).length;
  // Gem Fortitude: +2 HP per ring worn (per equipped item carrying the trait)
  let equipped=[];
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{
    if(S.equipment[k]) equipped.push(S.equipment[k]);
  });
  S.equipment.rings.forEach(x=>{if(x)equipped.push(x);});
  for(let it of equipped){
    if(!it.trait) continue;
    let traits=splitTraits(it.trait);
    for(let t of traits){
      if(/Gem Fortitude/.test(t)) hp+=2*ringCount;
    }
  }
  return hp;
}

function makeItem(type){
  // Ring of Greed: 30% chance to force any generated item to be a ring
  if(hasTrait("Ring of Greed")&&type!=="ring"&&Math.random()<0.30){
    type="ring";
  }
  // --- SCALING: Loot quality is driven by FLOOR DEPTH, not hero level ---
  // Loot power ≈ floor^1.2. Hero level must NOT inflate loot, otherwise a
  // high-level hero could farm floor 1 for strong gear. A tiny level term
  // (×0.1) is kept only so progression never feels punishing — it is
  // negligible on shallow floors (level 5 on floor 1 adds just +0.5), so a
  // powerful hero on floor 1 still finds mostly crappy loot. The real reward
  // comes from paying the toll and descending to deeper floors.
  let lootScale=Math.pow(S.floor,1.2)+S.level*0.1;

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

  // --- LOOT-QUALITY TRAITS: bump rarity index ---
  // Deep Radiance: loot quality +1 per ring worn (capped so it stays reasonable)
  // Treasure Sense: small flat loot-quality boost
  let rarBoost=0;
  if(hasTrait("Deep Radiance")){
    let rcnt=S.equipment.rings.filter(x=>x).length;
    rarBoost+=Math.min(2,Math.floor(rcnt/3)); // +1 per 3 rings, max +2
  }
  if(hasTrait("Treasure Sense")&&Math.random()<0.5) rarBoost+=1;
  if(rarBoost>0) r=Math.min(rar.length-1,r+rarBoost);

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

  // Quaternary "PERFECT" stat — only Mythical+ (r>=4), and only ~20% of those.
  // Fills whatever stat is still MISSING so the item covers ALL FOUR stats, at a
  // lower value. A rare, coveted roll: a true all-stat item for top-tier gear.
  if(r>=4&&Math.random()<0.20){
    let missing=p.filter(k=>!i.stats[k]);
    if(missing.length>0){
      let q=missing[Math.floor(Math.random()*missing.length)];
      let qVal=Math.max(1,Math.round(primaryVal*(0.08+Math.random()*0.17))); // ~8-25% of primary
      i.stats[q]=qVal;
    }
  }

  // FOCUSED-ITEM BONUS: if the item ended up with only ONE stat, bump that stat
  // hard (×1.5-1.9) so a "pure" single-stat piece is a genuine specialist choice
  // vs a spread-stat item — never just a strictly-worse roll. The more stats an
  // item has, the more total value it carries; this keeps single-stat items in the
  // conversation by concentrating that value into one big number.
  {
    let statKeys=Object.keys(i.stats);
    if(statKeys.length===1){
      let k=statKeys[0];
      i.stats[k]=Math.max(1,Math.round(i.stats[k]*(1.5+Math.random()*0.4)));
    }
  }

  // --- TRAITS ---
  // Chance increases with rarity and floor depth
  let traitChance=0.08+r*0.08+Math.min(0.2,S.floor*0.003);
  // Rings have higher trait chance — they're the key equipment as a Dwarf!
  if(type==="ring") traitChance+=0.20;
  // Amulets are luck/utility focused — also higher trait chance
  if(type==="amulet") traitChance+=0.25;
  // Dual Spark: +10% trait chance globally while equipped
  if(hasTrait("Dual Spark")) traitChance+=0.10;
  // Mythical+ (r>=4) ALWAYS get their signature base trait — pinnacle gear is never blank.
  if(r>=4) traitChance=1;
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
  // EXTRA TRAITS by rarity/prestige (v1.2):
  //  - Epic+ (r>=3): chance at a 2nd trait.
  //  - Mythical+ (r>=4): chance at a 3rd trait.
  //  - Prestige items (floor 250+, i.prestige set): chance at a coveted 4th trait.
  // Each added trait is picked from the item's pool and must not duplicate an
  // existing one. Traits are stored comma-joined (", "); descriptions are comma-free.
  function traitPool(){
    return type==="ring"&&Math.random()<0.5?ringTraits
      :type==="amulet"&&Math.random()<0.5?amuletTraits:traits;
  }
  function addTrait(){
    let have=splitTraits(i.trait);
    // Try a few times to find a trait not already on the item.
    for(let tries=0;tries<20;tries++){
      let cand=traitPool()[Math.floor(Math.random()*traitPool().length)];
      if(!have.includes(cand)){
        i.trait=i.trait?i.trait+", "+cand:cand;
        return true;
      }
    }
    return false;
  }
  // Extra-trait chances scale with rarity, with a big PRESTIGE (floor 250+) bonus so
  // pinnacle endgame items rarely have just one trait.
  let pBonus=i.prestige?0.35:0;
  // 2nd trait — RARE+; near-GUARANTEED by Divine, and effectively guaranteed on
  // prestige items (0.40 + r*0.12 + prestige → ≥1.0 for Divine/prestige).
  if(r>=2&&Math.random()<0.40+r*0.12+pBonus) addTrait();
  // 3rd trait — EPIC+; climbs with rarity, strongly boosted by prestige.
  if(r>=3&&Math.random()<0.18+(r-3)*0.07+pBonus) addTrait();
  // 4th trait — prestige (floor 250+) items only; a coveted endgame chase.
  if(i.prestige&&Math.random()<0.45) addTrait();

  return i;
}
function slot(i){return i.type==="ring"?"rings":i.type}

// --- LEGENDARY ITEM GENERATION (critical success d20=20) ---
// These are unique, powerful items that feel like "no one else has found this"

function makeLegendaryItem(forceType){
  let type=forceType||types[Math.floor(Math.random()*types.length)];
  // Floor-driven scaling (see makeItem) — level barely factors in so deep
  // descents, not grinding shallow floors, are what yields powerful loot.
  let lootScale=Math.pow(S.floor,1.2)+S.level*0.1;

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

  // Quaternary "PERFECT" 4th stat — legendaries are prime candidates for an
  // all-four-stat item. ~35% chance to fill whatever stat is still MISSING, at a
  // lower value. (Higher chance than normal loot since these are the flashy finds.)
  if(Math.random()<0.35){
    let missing=p.filter(k=>!i.stats[k]);
    if(missing.length>0){
      let q=missing[Math.floor(Math.random()*missing.length)];
      i.stats[q]=Math.max(1,Math.round(primaryVal*(0.1+Math.random()*0.2)));
    }
  }

  // ALWAYS has a trait; extra traits by rarity/prestige (v1.2), non-duplicate.
  i.trait=traits[Math.floor(Math.random()*traits.length)];
  function addLegTrait(){
    let have=splitTraits(i.trait);
    for(let tries=0;tries<20;tries++){
      let cand=traits[Math.floor(Math.random()*traits.length)];
      if(!have.includes(cand)){ i.trait=i.trait+", "+cand; return true; }
    }
    return false;
  }
  if(Math.random()<0.55) addLegTrait();                 // 2nd (legendaries are flashy)
  if(r>=3&&Math.random()<0.30) addLegTrait();           // 3rd on epic+
  if(i.prestige&&Math.random()<0.45) addLegTrait();     // 4th on prestige (floor 250+)

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
  // Defensive: repair any legacy "null, X" trait from the old double-trait bug
  if(i.trait&&/^null(,\s*|$)/.test(i.trait)){
    i.trait=i.trait.replace(/^null,\s*/,"")||null;
    if(i.trait==="null") i.trait=null;
  }
  let buttons="";
  let val=itemValue(i);
  if(!dead){
    if(inv){
      if(i.type==="potion"){
        // Stored mystery potion — drink it (the gamble) or drop it. Can't equip/sell.
        buttons+=`<button onclick="drinkStoredPotion('${i.id}')">🧪 Drink</button><button onclick="discard('${i.id}')">🗑️ Drop</button>`;
      } else {
        buttons+=`<button onclick="equip('${i.id}')">⬆️ Equip</button><button onclick="discard('${i.id}')">🗑️ Drop</button>`;
        // Sell direct from inventory ONLY when standing at a trader
        let r=room();
        if(r&&r.trader) buttons+=`<button onclick="sellFromInventory('${i.id}')">💰 Sell ${val}</button>`;
      }
    }
    if(equipped) buttons+=`<button onclick="unequip('${i.id}','${equipped}')">⬇️ Unequip</button>`;
    // Scarred-finger warning: if this ring sits on a repaired (fragile) finger,
    // show a big 🩹 patch icon right after Unequip so the player is clearly warned
    // it's more likely to be lost again (replaces the earlier red-font approach).
    if(equipped&&typeof equipped==="string"&&equipped.startsWith("ring")){
      let ringIdx=parseInt(equipped.replace("ring",""));
      if((S.repairedFingers||[]).includes(ringIdx)){
        buttons+=`<span class="scar-patch" title="Scarred finger — fragile, more likely to be lost again">🩹</span>`;
      }
    }
  }
  // Comparison vs currently-equipped item in the same slot (inventory items only;
  // never for potions, which aren't equippable).
  let cmp=(inv&&i.type!=="potion")?compareLine(i):"";
  // Trait display — strike out a spent once-per-run/floor cheat-death trait.
  //  Phoenix Rebirth: once per RUN (S.phoenixUsed) → struck out permanently once used.
  //  Death Ward: once per FLOOR → struck out only while on a floor where it's been
  //  used (S.deathWardFloors[]); it recharges on the next floor, so the strikeout
  //  updates automatically every ascend/descend (render re-runs with the new floor).
  // Trait display — one line per trait, each with its own ⚡. Per-trait strikeout
  // for spent cheat-death traits. Equipped items get a per-trait 🎲 reroll button
  // (pay gold to reroll THAT specific trait; repeatable).
  let traitHtml="";
  if(i.trait){
    let traitList=splitTraits(i.trait);
    // Current floor-scaled elemental damage (matches combat.js: base..2×base per trait).
    let elemBase=Math.max(1,Math.round(Math.pow(S.floor,1.1)*0.3));
    let elemNames=["Flameburst","Thunderstrike","Frostbite","Poison Edge","Venomcoat"];
    traitHtml=traitList.map((t,ti)=>{
      let phoenixUsed=(/Phoenix Rebirth/.test(t)&&S.phoenixUsed);
      let wardUsedHere=(/Death Ward/.test(t)&&(S.deathWardFloors||[]).includes(S.floor));
      let rerollBtn=(!dead&&(equipped||inv))?` <button class="reroll-btn" title="Reroll this trait for gold" onclick="rerollTrait('${i.id}','',${ti})">🎲 ${rerollCost()}💰</button>`:"";
      // Append the ACTUAL current damage for elemental traits (updates per floor).
      let elemNote=elemNames.some(n=>t.includes(n))?` <span class="elem-now">≈ +${elemBase}-${elemBase*2} now</span>`:"";
      if(phoenixUsed) return `<div class="trait trait-used"><s>⚡ ${t}</s> <span class="small">(used)</span></div>`;
      if(wardUsedHere) return `<div class="trait trait-used"><s>⚡ ${t}</s> <span class="small">(used this floor)</span>${rerollBtn}</div>`;
      return `<div class="trait">⚡ ${t}${elemNote}${rerollBtn}</div>`;
    }).join("");
  }
  // Name display — potions show their stack count (e.g. "Mystery Potion 3/10").
  let nameHtml=(i.type==="potion")?`${i.name} <span class="stack-count">${i.count||1}/10</span>`:i.name;
  return`<div class="item ${i.rarity} ${i.depth}${i.prestige?" prestige-"+i.prestige:""}"><span class="art">${i.art}</span><b>${nameHtml}</b><div class="item-type">${typeLabel(i.type)}</div><div>${Object.entries(i.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>${traitHtml}<div class="small">${i.rarity[0].toUpperCase()+i.rarity.slice(1)} · ${i.depth[0].toUpperCase()+i.depth.slice(1)}${i.prestige?` · ✦${i.prestige[0].toUpperCase()+i.prestige.slice(1)}✦`:""} · 💰 ${val}</div>${cmp}${buttons}</div>`;
}

// Build a "vs equipped" comparison line for an inventory item
function compareLine(i,context){
  // context "shop" = buying (costs gold); default = equipping from inventory (free)
  let emptyMsg=context==="shop"?"an upgrade over an empty slot":"a free upgrade";
  let s=slot(i);
  let current;
  if(s==="rings"){
    // Compare against the WEAKEST equipped ring (what you'd likely replace)
    let rings=S.equipment.rings.filter(x=>x);
    if(rings.length===0) return `<div class="cmp cmp-new">✨ Nothing equipped here yet — ${emptyMsg}</div>`;
    // weakest by stat sum
    current=rings.reduce((a,b)=>statSum(a)<=statSum(b)?a:b);
  } else {
    current=S.equipment[s];
    if(!current) return `<div class="cmp cmp-new">✨ You have no ${typeLabel(i.type)} equipped — ${emptyMsg}</div>`;
  }
  // Compare stat totals and per-stat deltas
  let keys=["str","dex","int","cha"];
  let parts=[];
  for(let k of keys){
    let nv=(i.stats[k]||0), cv=(current.stats[k]||0), d=nv-cv;
    if(d!==0) parts.push(`${k.toUpperCase()} ${d>0?"+"+d+" ↑":d+" ↓"}`);
  }
  let totalDelta=statSum(i)-statSum(current);
  let totalStr=totalDelta>0?`<span class="cmp-up">+${totalDelta} total ↑</span>`:totalDelta<0?`<span class="cmp-down">${totalDelta} total ↓</span>`:`<span>even</span>`;
  let traitNote=(i.trait&&i.trait!==current.trait)?` · trait: ${i.trait}`:"";
  return `<div class="cmp">vs ${current.name.length>18?current.name.slice(0,18)+"…":current.name}: ${parts.join(" · ")||"same stats"} — ${totalStr}${traitNote}</div>`;
}

function statSum(x){ return Object.values(x.stats).reduce((a,b)=>a+b,0); }

// Friendly display label for an item type
function typeLabel(t){
  const labels={weapon:"⚔️ Weapon",helmet:"🪖 Helmet",armor:"🛡️ Body Armor",boots:"🥾 Boots",shoulders:"💪 Shoulders",trousers:"👖 Leggings",cape:"🧥 Cape",amulet:"📿 Amulet",ring:"💍 Ring",potion:"🧪 Mystery Potion"};
  return labels[t]||t;
}

// Combined sell-value multiplier from gold traits (stack multiplicatively)
function goldMult(){
  let m=1;
  if(hasTrait("Gold Attraction")) m*=1.1;
  if(hasTrait("Gold Magnet")) m*=1.25;
  if(hasTrait("Merchant's Eye")) m*=2;
  return m;
}

// Sell value of an item (CHA-boosted, same formula as trader modal)
function itemValue(x){
  // CHA improves sell prices (+3%/pt) but is HARD-CAPPED at +100%.
  let chaBonus=1+Math.min(1.0,(eff().cha||1)*0.03);
  // Sell value scales with the item's stats AND with DEPTH — deep-floor loot should
  // feel genuinely more valuable than shallow loot (a floor-40 item sells far more
  // than a floor-10 one). depthFactor = 1 + floor/100 (endless, no cap). Tolls are a
  // big gold sink now, so richer sales don't create a fountain.
  let depthFactor=1+(S.floor||1)/100;
  let statSum=Object.values(x.stats).reduce((a,b)=>a+b,0);
  return Math.max(1,Math.floor((statSum*1.6+(rar.indexOf(x.rarity)+1)*4)*chaBonus*goldMult()*depthFactor));
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
    // Player CHOOSES which finger to wear the ring on (a gut-feeling gamble, since
    // fingers are lost at random). Always open the finger picker; if there's not a
    // single usable finger (all lost), fall back to a message.
    let anyUsable=S.equipment.rings.some((x,idx)=>!isFingerLost(idx));
    if(!anyUsable) return msg("⚠️ You have no fingers left to wear a ring.");
    showFingerPicker(id);
    return;
  } else {
    let old=S.equipment[s];
    S.equipment[s]=i;
    if(old) S.inventory[n]=old;
    else S.inventory.splice(n,1);
  }
  if(typeof checkAchievements==="function") checkAchievements();
  save();render();
}

// --- FINGER PICKER: choose which finger to wear a ring on (a comparison screen) ---
// Shows the found ring's stats up top, and EACH occupied finger's ring stats so you
// can decide which to replace. Also: "Put in inventory" (only if space) and
// "Toss away" (permanently discard) so the ring is never forced onto a finger.
function ringStatLine(x){
  if(!x) return "";
  let stats=Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ");
  return `${stats}${x.trait?` · ⚡ ${x.trait}`:""}`;
}
// Per-stat ▲/▼ comparison of an incoming ring vs the ring currently on a finger.
// Shows each stat that differs (incoming − current), e.g. "STR ▲+30 · DEX ▼-5".
function perStatCompare(incoming,occ){
  let keys=["str","dex","int","cha","luck"];
  let parts=[];
  for(let k of keys){
    let d=(incoming.stats[k]||0)-((occ&&occ.stats[k])||0);
    if(d>0) parts.push(`<span class="cmp-up">${k.toUpperCase()} ▲+${d}</span>`);
    else if(d<0) parts.push(`<span class="cmp-down">${k.toUpperCase()} ▼${d}</span>`);
  }
  return parts.length?parts.join(" · "):`<span>same stats</span>`;
}
function showFingerPicker(itemId){
  let it=S.inventory.find(x=>x.id===itemId);
  if(!it) return;
  let scarred=(S.repairedFingers||[]);
  let incomingSum=statSum(it); // total stats of the ring we're placing
  function fingerCell(slotIdx){
    let handName=slotIdx<5?"L":"R";
    let fingerNum=(slotIdx%5)+1;
    if(isFingerLost(slotIdx)) return `<div class="finger-pick finger-lost">❌ ${handName}${fingerNum} — Lost</div>`;
    let scar=scarred.includes(slotIdx);
    let occ=S.equipment.rings[slotIdx];
    let scarClass=scar?" finger-scarred":"";
    // Comparison vs the incoming ring — TOTAL verdict + PER-STAT arrows.
    let cmp, perStat="";
    if(occ){
      let delta=incomingSum-statSum(occ);
      cmp=delta>0?`<span class="cmp-up">▲ +${delta} total</span>`
        :delta<0?`<span class="cmp-down">▼ ${delta} total</span>`
        :`<span>= same total</span>`;
      perStat=`<div class="small fp-perstat">${perStatCompare(it,occ)}</div>`;
    } else {
      cmp=`<span class="cmp-up">✨ empty — free upgrade</span>`;
    }
    let head=`${scar?"🩹 ":""}${handName}${fingerNum} ${occ?"— REPLACE:":"— empty"}  ${cmp}`;
    let body=occ?`<div class="finger-ring-name"><b>${occ.name}</b></div><div class="small">${ringStatLine(occ)}</div>${perStat}`:(scar?`<div class="small">⚠️ scarred — fragile</div>`:"");
    return `<div class="finger-pick${scarClass}" onclick="placeRingOnFinger('${itemId}',${slotIdx})" title="${handName==="L"?"Left":"Right"} hand, finger ${fingerNum}${scar?" — SCARRED (fragile, more likely lost again)":""}">${head}${body}</div>`;
  }
  let left=[0,1,2,3,4].map(fingerCell).join("");
  let right=[5,6,7,8,9].map(fingerCell).join("");
  let canStore=S.inventory.length<30; // the found ring occupies a slot already, so
  // "keep in inventory" is only offered when there is genuine free space to leave it.
  let storeBtn=canStore?`<button class="fp-store" onclick="document.getElementById('fingerPicker').remove()">📦 Keep in inventory</button>`:"";
  let html=`<div class="discard-overlay" id="fingerPicker">
    <div class="discard-box">
      <h3>💍 Where to wear ${it.name}?</h3>
      <div class="fp-found item ${it.rarity} ${it.depth}">
        <span class="art">${it.art}</span> <b>${it.name}</b>
        <div class="small">Found ring (total ${incomingSum}): ${ringStatLine(it)||"(no stats)"}</div>
      </div>
      <p class="small">Each finger shows the <b>total</b> verdict and <b>per-stat</b> ▲/▼ vs its current ring (green = the new ring is better). <span style="color:#e67e22">🩹 = scarred</span> (fragile). Placing on an occupied finger swaps the old ring back to inventory.</p>
      <div class="finger-hand"><b>🫲 Left hand</b><div class="finger-col">${left}</div></div>
      <div class="finger-hand"><b>🫱 Right hand</b><div class="finger-col">${right}</div></div>
      <div class="fp-actions">
        ${storeBtn}
        <button class="fp-toss" onclick="tossRing('${itemId}')">🗑️ Toss away</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}
window.showFingerPicker=showFingerPicker;

// Toss the found ring — permanently destroyed (replaces "Cancel" when you don't
// want it on any finger and won't keep it).
function tossRing(itemId){
  let modal=document.getElementById("fingerPicker");
  if(modal)modal.remove();
  let n=S.inventory.findIndex(x=>x.id===itemId);
  if(n<0)return;
  let tossed=S.inventory[n];
  S.inventory.splice(n,1);
  msg(`🗑️ ${tossed.name} permanently destroyed. It is gone forever.`);
  save();render();
}
window.tossRing=tossRing;

// Place the ring on the chosen finger. Empty slot = just place; occupied = swap
// (old ring returns to inventory). Blocked on lost fingers.
function placeRingOnFinger(itemId,slotIdx){
  let modal=document.getElementById("fingerPicker");
  if(modal)modal.remove();
  if(isFingerLost(slotIdx)) return;
  let n=S.inventory.findIndex(x=>x.id===itemId);
  if(n<0)return;
  let newRing=S.inventory[n];
  let old=S.equipment.rings[slotIdx];
  S.equipment.rings[slotIdx]=newRing;
  if(old){ S.inventory[n]=old; msg(`💍 Swapped ${old.name} for ${newRing.name}.`); }
  else { S.inventory.splice(n,1); msg(`💍 You wear ${newRing.name}.`); }
  if(typeof checkAchievements==="function") checkAchievements();
  save();render();
}
window.placeRingOnFinger=placeRingOnFinger;

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

// --- PER-TRAIT REROLL ---
// Pay gold to reroll ONE chosen trait on ANY item you own — equipped OR in extra
// inventory (so you can improve a near-miss before deciding to equip it). Repeatable;
// cost scales with floor depth. On a multi-trait item, only the selected trait
// (by index) is replaced with a fresh random trait from the item's appropriate pool.
function rerollCost(){
  return Math.max(50,Math.round(Math.pow(S.floor,1.3)*8+40));
}
// Find an owned item by id, searching equipment slots, ring slots, and inventory.
function findItemById(id){
  for(let k of ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"]){
    if(S.equipment[k]&&S.equipment[k].id===id) return S.equipment[k];
  }
  for(let r of S.equipment.rings){ if(r&&r.id===id) return r; }
  return S.inventory.find(x=>x.id===id)||null;
}
function rerollTrait(itemId,slotKey,traitIndex){
  if(S.hp<=0)return;
  let it=findItemById(itemId); // works for equipped OR inventory items
  if(!it||!it.trait) return;
  let cost=rerollCost();
  if((S.gold||0)<cost) return msg(`🎲 A trait reroll costs ${cost} 💰 — you only have ${S.gold||0}.`);
  let list=splitTraits(it.trait);
  if(traitIndex<0||traitIndex>=list.length) return;
  // Pick the pool matching the item type (rings/amulets have their own synergy pools).
  let pool=it.type==="ring"?ringTraits:it.type==="amulet"?amuletTraits:traits;
  let old=list[traitIndex];
  // Roll a NEW trait different from the one being replaced (and not duplicating
  // another trait already on this item, when possible).
  let candidate=old, tries=0;
  do{ candidate=pool[Math.floor(Math.random()*pool.length)]; tries++; }
  while((candidate===old||list.includes(candidate))&&tries<40);
  list[traitIndex]=candidate;
  it.trait=list.join(", ");
  S.gold-=cost;
  S.goldSpent=(S.goldSpent||0)+cost;
  msg(`🎲 Reroll! "${old}" became "${candidate}". (-${cost} 💰)`);
  if(typeof checkAchievements==="function") checkAchievements();
  save();render();
}
window.rerollTrait=rerollTrait;

// --- DISCARD: permanently drop an inventory item ---
function discard(id){
  let n=S.inventory.findIndex(i=>i.id===id);
  if(n<0)return;
  let name=S.inventory[n].name;
  S.inventory.splice(n,1);
  msg(`🗑️ ${name} permanently destroyed. It is gone forever.`);
  save();render();
}
