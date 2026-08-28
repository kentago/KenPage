// --- COMBAT SYSTEM ---
const OPP={N:"S",S:"N",E:"W",W:"E"};
const DIR_DX={N:0,S:0,E:1,W:-1};
const DIR_DY={N:-1,S:1,E:0,W:0};

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

// --- DEATH HANDLING ---
function damage(n){
  S.hp=Math.max(0,S.hp-n);
  if(S.hp===0){
    S.hp=0;
    msg("☠️ HP reached 0. The expedition has ended.");
    // Submit to global Hall of Fame and immediately re-render
    submitToGlobalHall().then(()=>renderHall());
  } else {
    render();
  }
}

function spawn(){
  // --- ENEMY GENERATION SYSTEM ---
  // Tiers: common (floors 1+), mid (floors 5+), hard (floors 15+), elite (floors 30+), boss (floors 50+)
  const elements=ENEMY_ELEMENTS;
  const common=ENEMY_COMMON;
  const mid=ENEMY_MID;
  const hard=ENEMY_HARD;
  const elite=ENEMY_ELITE;
  const boss=ENEMY_BOSS;

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

// --- BOSS SYSTEM ---
// Every 5th floor has a randomized boss guarding the ladder down
// Same "role" each playthrough but different element, stats, abilities

function floorHasBoss(){
  // Check if any room on this floor already has a boss
  for(let k of Object.keys(S.rooms)){
    let parts=k.split(":");
    if(parseInt(parts[0])!==S.floor)continue;
    let rm=S.rooms[k];
    if(rm.enemy&&rm.enemy.isBoss)return true;
  }
  return false;
}

function spawnBoss(){
  let elements=ENEMY_ELEMENTS;
  let template=bossTemplates[Math.floor(Math.random()*bossTemplates.length)];
  let title=template.titles[Math.floor(Math.random()*template.titles.length)];
  let element=elements[Math.floor(Math.random()*elements.length)];

  // Boss name: "Tungsten Fire Ironguard of the Deep"
  let prefix=questPrefixes[Math.floor(Math.random()*questPrefixes.length)];
  let name=`${prefix} ${element} ${template.name} ${title}`;

  // Stats scale with danger curve but 5-8× stronger than normal enemies
  let dangerScale=Math.pow(S.floor,1.6);
  let bossMultiplier=5+Math.random()*3; // 5-8×
  let hp=Math.round(dangerScale*bossMultiplier*1.2);
  let atk=Math.round(dangerScale*bossMultiplier*0.25);

  // Random abilities (1-2)
  let ability1=bossAbilities[Math.floor(Math.random()*bossAbilities.length)];
  let ability2=Math.random()<0.4?bossAbilities[Math.floor(Math.random()*bossAbilities.length)]:null;
  if(ability2===ability1) ability2=null;

  // Element damage
  let elementDmg=Math.round(dangerScale*0.12);

  return{
    name,hp,atk,element,elementDmg,
    tier:"boss",isBoss:true,
    abilities:[ability1,ability2].filter(x=>x),
    xpMultiplier:5+Math.floor(S.floor/10) // Bosses give 5-10× XP
  };
}

function fight(){let r=room();if(!r.enemy||r.enemy.hp<=0)return;let hit=d20();if(hit===1){msg(`💥 Critical miss! ${r.enemy.name} counterattacks.`);let counterDmg=Math.max(1,(r.enemy.atk||3)+d20()%3);damage(counterDmg);if(Math.random()<0.08)loseFinger();return}
  // STR = attack damage
  let rightMangled=S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5;
  let leftMangled=S.lostFingers&&S.lostFingers.left&&S.lostFingers.left.length>=5;
  let strDmg=Math.floor((S.stats.str||1)*0.4); // +0.4 damage per STR
  let n=Math.max(1,1+d20()%8+strDmg); // d8 (1-8) + STR scaling
  if(rightMangled) n=Math.max(1,Math.floor(n*0.4)); // 60% reduction without weapon hand
  // Critical hit on 20
  if(hit===20){n=Math.floor(n*2.5);msg(`💥 CRITICAL HIT!`);}
  r.enemy.hp=Math.max(0,r.enemy.hp-n);
  if(r.enemy.hp===0){
    let defeated=r.enemy.name;
    // XP reward based on enemy tier
    let dangerXP=Math.pow(S.floor,1.4);
    let xpMult=r.enemy.isBoss?(r.enemy.xpMultiplier||5):1;
    let xpGain=Math.round((r.enemy.tier==="common"?dangerXP*1.5:r.enemy.tier==="mid"?dangerXP*3:r.enemy.tier==="hard"?dangerXP*6:r.enemy.tier==="elite"?dangerXP*12:dangerXP*25)*xpMult);
    let wasBoss=r.enemy.isBoss;
    let enemyTier=r.enemy.tier;
    // Kill streak tracking
    S.killStreak=(S.killStreak||0)+1;
    S.totalKills=(S.totalKills||0)+1;
    if(S.killStreak>(S.bestKillStreak||0)) S.bestKillStreak=S.killStreak;
    // Combo XP multiplier: +10% per streak kill (caps at 3×)
    let comboMult=Math.min(3,1+S.killStreak*0.1);
    S.xp+=Math.round(xpGain*comboMult);
    // Gold drop — scales with floor and enemy tier
    let goldBase=Math.pow(S.floor,1.2)*0.5;
    let tierGoldMult=enemyTier==="common"?1:enemyTier==="mid"?2:enemyTier==="hard"?4:enemyTier==="elite"?8:enemyTier==="boss"?20:1;
    let goldDrop=Math.max(1,Math.round(goldBase*tierGoldMult*(0.5+Math.random())));
    S.gold=(S.gold||0)+goldDrop;
    checkLevelUp();
    r.enemy=null;
    let streakMsg=S.killStreak>=3?` 🔥 Kill streak: ${S.killStreak}× (${Math.round(comboMult*100)}% XP)`:"";
    msg(`☠️ ${defeated} is defeated! +${Math.round(xpGain*comboMult)} XP · +${goldDrop} 💰${streakMsg}`);
    // Boss guaranteed legendary drop
    if(wasBoss){
      let bossLoot=makeLegendaryItem();
      msg(`👑 The ${defeated} drops a legendary treasure!\n🎁 ${bossLoot.name}! ${obtain(bossLoot)}`);
    }
  } else {
    msg(`⚔️ You hit ${r.enemy.name} for ${n}. (${r.enemy.hp} HP left)`);
    // Enemy attacks back using its atk stat
    let enemyAtk=r.enemy.atk||Math.max(1,d20()%6);
    // DEX dodge chance — completely avoid the hit
    let dodgeChance=Math.min(0.30,(S.stats.dex||1)*0.012); // +1.2% per DEX, max 30%
    if(Math.random()<dodgeChance){
      msg(`🌀 You dodge ${r.enemy.name}'s attack! (DEX)`);
      return;
    }
    let incomingDmg=Math.max(1,enemyAtk+d20()%3-1);
    // CHA reduces incoming damage slightly — monsters find you endearing
    let chaReduction=1-Math.min(0.25,(S.stats.cha||1)*0.01); // -1% per CHA, max -25%
    incomingDmg=Math.max(1,Math.round(incomingDmg*chaReduction));
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
  let n=d20()+Math.floor((S.stats.dex||1)/8); // DEX bonus to flee (+1 per 8 DEX)

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
