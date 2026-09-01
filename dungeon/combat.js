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
  // Base chance decreases exponentially with each CURRENTLY-lost finger:
  // fewer fingers remaining = harder to lose another.
  // 0 lost: 1.0x, 1 lost: 0.6x, 2: 0.35x, ...
  let lost=totalLostFingers();
  let chance=Math.pow(0.55,lost);
  // Scar tissue: each finger that has been surgically REPAIRED makes future
  // losses more likely (+12% relative per repair, capped). Repaired fingers
  // are fragile — the dungeon claims them again more readily.
  let repaired=S.fingersRestored||0;
  chance*=(1+Math.min(1.0,repaired*0.12));
  return Math.min(1,chance);
}

function loseFinger(){
  if(!S.lostFingers) S.lostFingers={left:[],right:[]};

  // Roll against progressive difficulty
  if(Math.random()>fingerLossChance()) return;

  // Finger Ward traits STACK multiplicatively (diminishing returns, never 100%).
  // Each ward reduces the remaining chance of losing the finger.
  // Count them independently — "Finger Ward" is a substring of "Finger Ward Amulet",
  // so detect the amulet first, then check for a ring ward that isn't the amulet.
  let hasAmuletWard=hasTrait("Finger Ward Amulet");
  let hasRingWard=hasTraitExact("Finger Ward"); // ring-style, exact base (not the amulet)
  let surviveChance=1;
  if(hasAmuletWard) surviveChance*=(1-0.60);
  if(hasRingWard)   surviveChance*=(1-0.50);
  let wardChance=Math.min(0.85,1-surviveChance); // hard cap — fingers always carry some risk
  if(wardChance>0&&Math.random()<wardChance){
    msg(`💍 Finger Ward flares — your fingers are spared this time!`);
    return;
  }

  // Find available fingers (not already lost)
  let available=[];
  for(let i=0;i<5;i++){
    if(!S.lostFingers.left.includes(i)) available.push({hand:"left",idx:i,slot:i});
  }
  for(let i=0;i<5;i++){
    if(!S.lostFingers.right.includes(i)) available.push({hand:"right",idx:i,slot:i+5});
  }
  if(available.length===0) return; // all 10 already lost

  // Scarred (previously-repaired) fingers are fragile — 60% chance the loss
  // targets one of them first, if any scarred finger is currently intact.
  let pick;
  let scarred=(S.repairedFingers||[]);
  let scarredAvail=available.filter(f=>scarred.includes(f.slot));
  if(scarredAvail.length>0&&Math.random()<0.60){
    pick=scarredAvail[Math.floor(Math.random()*scarredAvail.length)];
  } else {
    pick=available[Math.floor(Math.random()*available.length)];
  }
  if(pick.hand==="left") S.lostFingers.left.push(pick.idx);
  else S.lostFingers.right.push(pick.idx);
  S.fingersLostTotal=(S.fingersLostTotal||0)+1;
  if(typeof checkAchievements==="function") checkAchievements();

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

// --- SLIPPERY LADDER ---
// A RARE mishap when using a ladder: your grip fails and you may lose a finger.
// Slippery rungs aren't common, so the base chance is low. A hand marked by old
// wounds is far more at risk: each SCARRED (previously-repaired) finger raises the
// slip chance the most, and each EQUIPPED RING adds a little (rings worsen your grip).
// If a slip triggers, we defer to loseFinger() — which ALREADY biases toward scarred
// fingers (60%) and can be blocked by Finger Ward — so a scarred/ringed finger goes
// first and a healthy bare hand is the safest. Called from useLadder() on any climb.
function slipperyLadder(){
  let scarred=(S.repairedFingers||[]).filter(idx=>!isFingerLost(idx)).length; // intact scars
  let rings=(S.equipment&&S.equipment.rings)?S.equipment.rings.filter(x=>x).length:0;
  let chance=0.025;                          // rare — slippery ladders are uncommon
  chance+=Math.min(0.06,scarred*0.02);       // scarred fingers are slip-prone (+2% each, cap +6%)
  chance+=Math.min(0.03,rings*0.006);        // ringed hand grips worse (+0.6% each, cap +3%)
  chance=Math.min(0.12,chance);              // absolute cap — never common
  if(Math.random()>=chance) return;
  // A slip happened — announce it, then let loseFinger() resolve (its own odds + wards
  // apply, and it favours scarred fingers). loseFinger() prints the outcome.
  msg(`🪜💦 The rungs are slick — your grip slips!`);
  loseFinger();
}

// --- DEATH HANDLING ---
function damage(n){
  S.hp=Math.max(0,S.hp-n);
  if(S.hp===0){
    // Death Ward: survive one fatal hit per floor at 1 HP. Track the floors it has
    // been used on in an array so the trait can be struck out per-floor in the UI.
    if(hasTrait("Death Ward")&&!(S.deathWardFloors||[]).includes(S.floor)){
      if(!S.deathWardFloors) S.deathWardFloors=[];
      S.deathWardFloors.push(S.floor);
      S.deathWardFloor=S.floor; // legacy field kept in sync
      S.hp=1;
      msg(`🛡️ DEATH WARD! A fatal blow is turned aside — you cling to life at 1 HP! (once per floor)`);
      render();
      return;
    }
    // Phoenix Rebirth: once per run, cheat death and revive at 40% HP
    if(hasTrait("Phoenix Rebirth")&&!S.phoenixUsed){
      S.phoenixUsed=true;
      S.hp=Math.max(1,Math.round(effMaxHp()*0.4));
      msg(`🔥 PHOENIX REBIRTH! You are reborn from the ashes at ${S.hp} HP! (once per run)`);
      render();
      return;
    }
    S.hp=0;
    // SOUL KEEPER: an equipped item with this trait is RETAINED into the next run —
    // but re-rolled to level-1/floor-1 stats (a modest head-start, not a snowball),
    // and its Soul Keeper trait is replaced with a different one so it can't retain
    // AGAIN (no infinite chain). Stashed to a separate localStorage key so it survives
    // the fresh() wipe; fresh() restores it into the new run.
    if(typeof stashSoulKeeperOnDeath==="function") stashSoulKeeperOnDeath();
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

  // --- HERO POWER SCALING (the "endless" balance) ---
  // The dungeon is infinite, so a hero with a +2000 weapon would one-shot any
  // floor-scaled enemy — and a floor-scaled hit could one-shot the hero. To keep
  // every fight tense at any depth, enemies also scale to the hero's ACTUAL
  // power (gear + stats + HP via eff/effMaxHp), exactly like bosses do.
  // We take the GREATER of floor-based and hero-based so weak heroes on deep
  // floors still face floor danger, while over-geared heroes get bumped foes.
  //
  // EARLY-GAME EXEMPTION (floors 1-2): the "peek/bump" is DISABLED so the run
  // starts gentle and rewarding — enemies use only their soft floor-based stats,
  // so a new hero can quickly farm gold/XP/stats and build toward deep descents.
  // (The protective single-hit CAP below still applies so nobody gets one-shot.)
  let E=(typeof eff==="function")?eff():{str:S.stats.str||1};
  let heroDmg=Math.max(1,4.5+(E.str||1)*0.4); // avg hero damage per swing (matches fight())
  let heroHp=(typeof effMaxHp==="function")?effMaxHp():(S.maxHp||20);
  let tierName=pool===common?"common":pool===mid?"mid":pool===hard?"hard":pool===elite?"elite":"boss";
  if(S.floor>=3){
    // Target hits-to-kill per tier (harder tiers take more solid hits to drop).
    let hitsCfg={common:[3,2],mid:[5,2],hard:[7,3],elite:[10,4]}[tierName]||[3,2];
    let hpFloor=Math.round(heroDmg*(hitsCfg[0]+Math.random()*hitsCfg[1]));
    // Target enemy hit as a fraction of hero max HP (never a one-shot). These were
    // raised (v1.2): at high level HP balloons, so low hit-% made normal enemies
    // harmless (clear 10 in a row without healing). Now each hit is a real chunk, so
    // a string of fights forces you to heal — while the 25% single-hit cap below
    // still prevents any one-shot.
    let pctCfg={common:[0.07,0.05],mid:[0.10,0.06],hard:[0.13,0.07],elite:[0.16,0.08]}[tierName]||[0.07,0.05];
    let atkFloor=Math.round(heroHp*Math.min(0.24,pctCfg[0]+Math.random()*pctCfg[1]));
    hp=Math.max(hp,hpFloor);
    atk=Math.max(atk,atkFloor);
    // Element damage should also stay relevant but never dominate — floor it so it
    // contributes on deep floors (only when hero-scaling is active).
    if(element){
      elementDmg=Math.max(elementDmg,Math.round(heroHp*0.03));
    }
  }
  // HARD CAP on a single hit: no enemy hit may exceed 25% of the hero's max HP.
  // This ALWAYS applies (every floor) so an under-geared hero — or a brand-new
  // floor-1 hero — can never be one-shot. Bounds both hero-scaled and raw values.
  let atkCap=Math.max(1,Math.round(heroHp*0.25));
  atk=Math.min(atk,atkCap);
  // Element damage cap (always) so element + base can't spike into one-shot territory.
  if(element){
    elementDmg=Math.min(elementDmg,Math.round(heroHp*0.06));
  }

  return{name,hp,maxHp:hp,atk,element,elementDmg,tier:tierName};
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

  // Stats scale with danger curve — but a boss must ALWAYS peak on the hero,
  // so we also scale to the hero's actual power (stats, HP, level, gear).
  let dangerScale=Math.pow(S.floor,1.6);
  let bossMultiplier=5+Math.random()*3; // 5-8×
  let hp=Math.round(dangerScale*bossMultiplier*1.2);
  let atk=Math.round(dangerScale*bossMultiplier*0.25);

  // --- HERO POWER SCALING ---
  // Estimate the hero's offensive power (roughly their per-hit damage) and HP pool.
  let E=(typeof eff==="function")?eff():{str:S.stats.str||1};
  let heroDmg=8+(E.str||1)*0.4;                 // approx damage per swing
  let heroHp=(typeof effMaxHp==="function")?effMaxHp():S.maxHp;
  // Boss HP should take MANY hits to whittle down — at least ~18-25 solid hits.
  let hpFloor=Math.round(heroDmg*(18+Math.random()*7));
  // Boss ATK should threaten the hero's HP pool — a boss hit ≈ 12-20% of hero maxHP.
  let atkFloor=Math.round(heroHp*(0.12+Math.random()*0.08));
  // Take the greater of floor-based and hero-based so it's never trivial.
  hp=Math.max(hp,hpFloor);
  atk=Math.max(atk,atkFloor);

  // Random abilities (1-2)
  let ability1=bossAbilities[Math.floor(Math.random()*bossAbilities.length)];
  let ability2=Math.random()<0.4?bossAbilities[Math.floor(Math.random()*bossAbilities.length)]:null;
  if(ability2===ability1) ability2=null;

  // Element damage
  let elementDmg=Math.round(dangerScale*0.12);

  return{
    name,hp,maxHp:hp,atk,element,elementDmg,
    tier:"boss",isBoss:true,
    abilities:[ability1,ability2].filter(x=>x),
    xpMultiplier:5+Math.floor(S.floor/10) // Bosses give 5-10× XP
  };
}

function fight(){let r=room();if(!r.enemy||r.enemy.hp<=0)return;let hit=d20();if(hit===1){msg(`💥 Critical miss! ${r.enemy.name} counterattacks.`);let counterDmg=Math.max(1,Math.round((r.enemy.atk||3)*0.6)+d20()%2);damage(counterDmg);if(S.floor>2&&Math.random()<0.08)loseFinger();return}
  let E=eff(); // effective stats (base + gear + traits)
  // STR = attack damage
  let rightMangled=S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5;
  let leftMangled=S.lostFingers&&S.lostFingers.left&&S.lostFingers.left.length>=5;
  let strDmg=Math.floor((E.str||1)*0.4); // +0.4 damage per STR
  let n=Math.max(1,1+d20()%8+strDmg); // d8 (1-8) + STR scaling
  if(rightMangled) n=Math.max(1,Math.floor(n*0.4)); // 60% reduction without weapon hand

  // --- OFFENSIVE COMBAT TRAITS ---
  let hpPct=S.hp/effMaxHp();
  // Berserker Rage / Battle Fury / Bloodlust: bonus damage when low HP
  if((hasTrait("Berserker Rage")||hasTrait("Battle Fury")||hasTrait("Bloodlust"))&&hpPct<0.4){
    n=Math.round(n*1.6); msg("🩸 Berserker rage surges — bonus damage while wounded!");
  }
  // Titan Strength / Dragonblood / Bone Rend / Deepforge Temper: flat +25%/+15% damage
  if(hasTrait("Titan Strength")||hasTrait("Dragonblood")||hasTrait("Bone Rend")) n=Math.round(n*1.25);
  if(hasTrait("Deepforge Temper")) n=Math.round(n*1.15);
  // --- RING SYNERGY DAMAGE TRAITS ---
  let ringCount=S.equipment.rings.filter(x=>x).length;
  // Paired Resonance: +15% damage when 2+ rings equipped
  if(hasTrait("Paired Resonance")&&ringCount>=2) n=Math.round(n*1.15);
  // Titan Grip: STR × rings scaling bonus to attack
  if(hasTrait("Titan Grip")){
    let grip=Math.round((E.str||1)*ringCount*0.1);
    if(grip>0){ n+=grip; }
  }
  // Death Mark: execute bonus vs enemies below 30% HP
  if(hasTrait("Death Mark")&&r.enemy.hp<r.enemy.maxHp*0.3){
    n=Math.round(n*1.35); msg("💀 Death Mark — you strike the wounded foe harder!");
  }
  // Void Touch: armor pierce — extra flat damage based on enemy's remaining HP
  if(hasTrait("Void Touch")){
    let pierce=Math.max(1,Math.round(r.enemy.hp*0.1));
    n+=pierce;
  }
  // Crit hit on natural 20 (Crit Amplifier boosts crit multiplier)
  if(hit===20){
    let critMult=hasTrait("Crit Amplifier")?3.5:2.5;
    n=Math.floor(n*critMult);
    msg(`💥 CRITICAL HIT!${hasTrait("Crit Amplifier")?" (Amplified!)":""}`);
    // Critical Fortune: crits shower bonus gold
    if(hasTrait("Critical Fortune")){
      let critGold=Math.max(1,Math.round(Math.pow(S.floor,1.2)*0.6));
      S.gold=(S.gold||0)+critGold;
      msg(`🪙 Critical Fortune! You strike loose +${critGold} gold!`);
    }
  }
  // Flameburst / Thunderstrike / Frostbite / Poison Edge / Venomcoat: bonus elemental/poison damage.
  // Each elemental trait equipped adds its own roll (they STACK). Range: base to ~2× base.
  let elemTraits=["Flameburst","Thunderstrike","Frostbite","Poison Edge","Venomcoat"].filter(t=>hasTrait(t)).length;
  if(elemTraits>0){
    let base=Math.max(1,Math.round(Math.pow(S.floor,1.1)*0.3));
    let elem=0;
    for(let e=0;e<elemTraits;e++) elem+=base+Math.floor(Math.random()*(base+1)); // base..2×base each
    n+=elem; msg(`🔥 Elemental strike adds +${elem} damage!`);
  }
  // Echostrike: chance to hit twice
  if(hasTrait("Echostrike")&&Math.random()<0.25){
    n=Math.round(n*1.8); msg("⚡ Echostrike! Your blow strikes twice!");
  }
  // Shieldbreaker: extra vs high-HP enemies (bosses/elites)
  if(hasTrait("Shieldbreaker")&&(r.enemy.isBoss||r.enemy.tier==="elite")) n=Math.round(n*1.3);

  r.enemy.hp=Math.max(0,r.enemy.hp-n);

  // Lifesteal / Mana Drain: heal a portion of damage dealt
  if((hasTrait("Lifesteal")||hasTrait("Mana Drain"))&&S.hp<effMaxHp()){
    let heal=Math.max(1,Math.round(n*0.15));
    S.hp=Math.min(effMaxHp(),S.hp+heal);
    msg(`🩸 Lifesteal restores ${heal} HP.`);
  }
  if(r.enemy.hp===0){
    let defeated=r.enemy.name;
    // XP reward based on enemy tier.
    // dangerXP = floor^1.4 + a flat early-game base (+6). The flat term makes
    // SHALLOW floors actually rewarding (a new hero reaches L2 in ~10 kills, not
    // ~55) so the start ramp feels good; it's negligible vs floor^1.4 at depth,
    // so deep-game pacing is unchanged.
    let dangerXP=Math.pow(S.floor,1.4)+6;
    let xpMult=r.enemy.isBoss?(r.enemy.xpMultiplier||5):1;
    let xpGain=Math.round((r.enemy.tier==="common"?dangerXP*1.5:r.enemy.tier==="mid"?dangerXP*3:r.enemy.tier==="hard"?dangerXP*6:r.enemy.tier==="elite"?dangerXP*12:dangerXP*25)*xpMult);
    // OVER-LEVEL XP DAMPENER (v1.1): a strong hero who returns to a shallow floor
    // should NOT find it worthwhile to farm there. While the hero's level is within
    // a grace band of the floor, XP is full (normal progression untouched). Beyond
    // that, XP decays 15% per over-level, FLOORED at 15% of base — so a very
    // over-leveled hero still earns a small, non-insulting amount (not a flat 1),
    // but nowhere near enough to make shallow farming worthwhile.
    // Bosses are exempt (they're a deliberate landmark fight, not farmable).
    if(!r.enemy.isBoss){
      let over=(S.level||1)-(S.floor+5); // grace of 5 levels above the floor
      if(over>0){
        let damp=Math.max(0.15,Math.pow(0.85,over));
        xpGain=Math.max(1,Math.round(xpGain*damp));
      }
    }
    let wasBoss=r.enemy.isBoss;
    let enemyTier=r.enemy.tier;
    // Kill streak tracking
    S.killStreak=(S.killStreak||0)+1;
    S.roomsSinceKill=0; // fresh grace window after each kill
    S.totalKills=(S.totalKills||0)+1;
    if(S.killStreak>(S.bestKillStreak||0)) S.bestKillStreak=S.killStreak;
    // Combo XP multiplier: +10% per streak kill (caps at 3×)
    let comboMult=Math.min(3,1+S.killStreak*0.1);
    // Crystal Resonance: +10% XP from kills
    if(hasTrait("Crystal Resonance")) comboMult*=1.1;
    // Soul Chain: +5% XP per ring worn
    if(hasTrait("Soul Chain")){
      let rc=S.equipment.rings.filter(x=>x).length;
      comboMult*=(1+0.05*rc);
    }
    // XP Amplifier: +15% XP from all sources
    if(hasTrait("XP Amplifier")) comboMult*=1.15;
    S.xp+=Math.round(xpGain*comboMult);
    // Spirit Link: heal 5% max HP on kill
    if(hasTrait("Spirit Link")&&S.hp<effMaxHp()){
      let heal=Math.max(1,Math.round(effMaxHp()*0.05));
      S.hp=Math.min(effMaxHp(),S.hp+heal);
      msg(`✨ Spirit Link restores ${heal} HP on the kill.`);
    }
    // Gold drop — scales with floor and enemy tier
    let goldBase=Math.pow(S.floor,1.2)*0.5;
    let tierGoldMult=enemyTier==="common"?1:enemyTier==="mid"?2:enemyTier==="hard"?4:enemyTier==="elite"?8:enemyTier==="boss"?20:1;
    let goldDrop=Math.max(1,Math.round(goldBase*tierGoldMult*(0.5+Math.random())));
    S.gold=(S.gold||0)+goldDrop;
    S.goldEarned=(S.goldEarned||0)+goldDrop;
    checkLevelUp();
    r.enemy=null;
    r.hadEnemy=true; // room is now "looted" via combat — search here yields less
    let streakMsg=S.killStreak>=3?` 🔥 Kill streak: ${S.killStreak}× (${Math.round(comboMult*100)}% XP)`:"";
    msg(`☠️ ${defeated} is defeated! +${Math.round(xpGain*comboMult)} XP · +${goldDrop} 💰${streakMsg}`);
    if(typeof checkAchievements==="function") checkAchievements();
    // Boss guaranteed legendary drop
    if(wasBoss){
      S.bossKills=(S.bossKills||0)+1;
      let bossLoot=makeLegendaryItem();
      msg(`👑 The ${defeated} drops a legendary treasure!\n🎁 ${bossLoot.name}! ${obtain(bossLoot)}`);
      if(typeof checkAchievements==="function") checkAchievements();
    }
  } else {
    msg(`⚔️ You hit ${r.enemy.name} for ${n}. (${r.enemy.hp} HP left)`);
    // Dread Aura: chance the terrified enemy skips its attack
    if(hasTrait("Dread Aura")&&Math.random()<0.12){
      msg(`😨 ${r.enemy.name} cowers before your dread aura and skips its attack!`);
      return;
    }
    // Enemy attacks back using its atk stat
    let enemyAtk=r.enemy.atk||Math.max(1,d20()%6);
    // DEX dodge chance — completely avoid the hit
    let dodgeChance=Math.min(0.30,(E.dex||1)*0.012); // +1.2% per DEX, max 30%
    if(Math.random()<dodgeChance){
      msg(`🌀 You dodge ${r.enemy.name}'s attack! (DEX)`);
      return;
    }
    // Veilstep / Windwalker / Shadow Meld: extra chance to phase out of an attack
    if((hasTrait("Veilstep")||hasTrait("Windwalker")||hasTrait("Shadow Meld"))&&Math.random()<0.15){
      msg(`👻 You slip through the shadows, avoiding the blow!`);
      return;
    }
    let incomingDmg=Math.max(1,enemyAtk+d20()%3-1);
    // CHA reduces incoming damage slightly — monsters find you endearing
    let chaReduction=1-Math.min(0.25,(E.cha||1)*0.01); // -1% per CHA, max -25%
    incomingDmg=Math.max(1,Math.round(incomingDmg*chaReduction));
    // Defensive traits: Iron Will / Stoneguard / Obsidian Shell / Dwarven Fortitude.
    // Each equipped copy removes 25% of WHATEVER DAMAGE REMAINS (multiplicative
    // stacking), so more defensive gear helps with diminishing returns and can
    // never reach 0 — a hard cap of 75% total reduction keeps combat lethal.
    // 1 ward = -25%, 2 = -44%, 3 = -58%, 4 = -68% (capped 75%).
    let wards=(typeof countDefensiveWards==="function")?countDefensiveWards():0;
    if(wards>0){
      let taken=Math.pow(0.75,wards);        // fraction of damage still taken
      taken=Math.max(0.25,taken);            // hard cap: never reduce beyond 75%
      incomingDmg=Math.max(1,Math.round(incomingDmg*taken));
    }
    // Element bonus damage (Elemental Ward halves it)
    let elemDmg=r.enemy.elementDmg||0;
    if(elemDmg>0){
      let rc=S.equipment.rings.filter(x=>x).length;
      if(hasTrait("Elemental Ward")) elemDmg=Math.floor(elemDmg*0.5);
      // Element Shield: reduce element damage by 50% (stacks with Elemental Ward)
      if(hasTrait("Element Shield")) elemDmg=Math.floor(elemDmg*0.5);
      // Elemental Harmony: reduce element damage by ringCount (floor at 0)
      if(hasTrait("Elemental Harmony")) elemDmg=Math.max(0,elemDmg-rc);
      incomingDmg+=elemDmg;
      if(elemDmg>0) msg(`🔥 ${r.enemy.element} burns for +${elemDmg} damage!`);
    }
    if(leftMangled) incomingDmg=Math.ceil(incomingDmg*1.5);
    // Void Link: ignore 1 damage per ring worn (min 1 damage still lands)
    if(hasTrait("Void Link")){
      let rc=S.equipment.rings.filter(x=>x).length;
      incomingDmg=Math.max(1,incomingDmg-rc);
    }
    damage(incomingDmg);
    // Thornmail: reflect damage back to the attacker
    if(hasTrait("Thornmail")&&r.enemy&&r.enemy.hp>0){
      let reflect=Math.max(1,Math.round(incomingDmg*0.3));
      r.enemy.hp=Math.max(0,r.enemy.hp-reflect);
      msg(`🌵 Thornmail reflects ${reflect} damage back!`);
      if(r.enemy.hp===0) msg(`☠️ ${r.enemy.name} dies to its own strike!`);
    }
    // Regeneration / Moonlight Heal / Phoenix Rebirth: heal a little each combat turn
    if((hasTrait("Regeneration")||hasTrait("Moonlight Heal"))&&S.hp>0&&S.hp<effMaxHp()){
      let regen=Math.max(1,Math.round(effMaxHp()*0.03));
      S.hp=Math.min(effMaxHp(),S.hp+regen);
    }
  }}
function flee(){
  let r=room();
  if(!r.enemy||r.enemy.hp<=0)return;

  // Fleeing breaks the kill streak — retreating is not rampaging.
  if(typeof breakStreak==="function") breakStreak("you turned and fled"); else { S.killStreak=0; S.roomsSinceKill=0; }

  // Second Chance: flee always succeeds once per floor (no damage)
  if(hasTrait("Second Chance")&&S.secondChanceFloor!==S.floor){
    S.secondChanceFloor=S.floor;
    retreatToPrevRoom();
    msg("🍀 Second Chance! You slip away unharmed. (once per floor)");
    return;
  }

  let n=d20()+Math.floor((eff().dex||1)/8); // DEX bonus to flee (+1 per 8 DEX)

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
