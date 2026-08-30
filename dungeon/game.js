// --- CORE GAME STATE ---
let S=JSON.parse(localStorage.getItem(KEY)||"null")||fresh();

function fresh(){return{name:makeDwarfName(),nickname:"",level:1,xp:0,hp:20,maxHp:20,floor:1,x:0,y:0,prevX:0,prevY:0,gold:0,stats:{str:1,dex:1,int:1,cha:1},statBoostAvailable:true,starterRingPicked:false,statPoints:0,killStreak:0,bestKillStreak:0,roomsSinceKill:0,totalKills:0,actions:0,rooms:{"1:0:0":{searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null,rest:null,doctor:null}},inventory:[],equipment:{weapon:null,helmet:null,armor:null,boots:null,shoulders:null,trousers:null,cape:null,amulet:null,rings:Array(10).fill(null)},lostFingers:{left:[],right:[]},fingersRestored:0,repairedFingers:[],bossSpawnedFloors:{},tollsPaid:0,portals:[],quickTravelReturn:null,emergencyEscapes:0,phoenixUsed:false,deathWardFloor:null,secondChanceFloor:null,floorPositions:{},quests:[],completedQuests:[],questsDelivered:0,questAchievements:[],achievements:[],goldEarned:0,goldSpent:0,cleanHouse:0,fingersLostTotal:0,deepestFloor:1,bossKills:0,log:[`📖 ${intros[Math.floor(Math.random()*intros.length)]}`]}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function key(){return`${S.floor}:${S.x}:${S.y}`}
function room(){return S.rooms[key()]||(S.rooms[key()]={searched:false,blocked:{},enemy:null,ladder:null,secret:null,portal:null,npc:null,trader:null,rest:null,doctor:null})}

// Returns true if any room within `minDist` Manhattan distance on the current
// floor already has the given feature ("npc", "trader", "ladder", "rest", "doctor").
// Used to space special rooms apart so they never cluster next to each other.
function nearbyHas(feature,minDist){
  for(let k of Object.keys(S.rooms)){
    let parts=k.split(":");
    if(parseInt(parts[0])!==S.floor) continue;
    let rx=parseInt(parts[1]), ry=parseInt(parts[2]);
    let dist=Math.abs(rx-S.x)+Math.abs(ry-S.y);
    if(dist>minDist) continue;
    let rm=S.rooms[k];
    if(!rm) continue;
    if(feature==="npc"&&rm.npc&&!rm.npc.completed) return true;
    if(feature==="trader"&&rm.trader) return true;
    if(feature==="ladder"&&rm.ladder) return true;
    if(feature==="rest"&&rm.rest&&!rm.rest.depleted) return true;
    if(feature==="doctor"&&rm.doctor) return true;
  }
  return false;
}
function d20(){return 1+Math.floor(Math.random()*20)}
function msg(t){S.log.unshift(t);S.log=S.log.slice(0,100);save();render()}

// Break the current kill streak (if any) and reset the enemy-free room counter.
// reason is a short lore string shown in the log only when a streak is actually lost.
function breakStreak(reason){
  if((S.killStreak||0)>0){
    msg(`💤 Your kill streak of ${S.killStreak}× fades — ${reason}.`);
  }
  S.killStreak=0;
  S.roomsSinceKill=0;
}

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
    // Life Pulse: +1 HP for each newly explored room
    if(hasTrait("Life Pulse")&&S.hp>0&&S.hp<effMaxHp()){
      S.hp=Math.min(effMaxHp(),S.hp+1);
    }
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
    // Spawn NPC? (~8% chance, no enemy, and no other NPC within 2 rooms)
    if(!x.enemy&&!nearbyHas("npc",2)&&Math.random()<0.08){
      x.npc=spawnNPC();
    }
    // Spawn trader? (~6% chance, no enemy/npc, spaced from other traders)
    if(!x.enemy&&!x.npc&&!nearbyHas("trader",2)&&Math.random()<0.06){
      x.trader=spawnTrader();
    }
    // Spawn ladder down? (~10% chance, no enemy blocking it, spaced from other ladders)
    if(!x.enemy&&!x.ladder&&!nearbyHas("ladder",2)&&Math.random()<0.10){
      x.ladder={dir:"down",used:false,targetKey:null};
      // ALL non-boss ladders are TOLL-gated — must pay gold to use (a gold sink).
      // Base toll scales with floor depth; the actual price also escalates with
      // how many tolls you've already paid this run (see useLadder).
      // Boss-floor ladders are never toll-gated (the boss is already the gate).
      if(S.floor%5!==0){
        x.ladder.toll=Math.max(15,Math.round(Math.pow(S.floor,1.3)*4+20));
        x.ladder.tollPaid=false;
      }
      // Boss floors (every 5th floor) — ONE boss guards the FIRST ladder discovered.
      // Tracked per-floor so once handled (spawned), later ladders are free.
      if(S.floor%5===0&&!S.bossSpawnedFloors[S.floor]){
        S.bossSpawnedFloors[S.floor]=true;
        x.enemy=spawnBoss();
        msg(`👑 BOSS FIGHT! ${x.enemy.name} guards the descent!\n⚡ Abilities: ${x.enemy.abilities.join(" · ")}\nDefeat it to descend — there is no way past.`);
      }
    }
    // Spawn rest source? (~7% chance, spaced from other fountains)
    if(!x.rest&&!nearbyHas("rest",2)&&Math.random()<0.07){
      x.rest=spawnRestSource();
    }
    // Spawn doctor? (~5% chance, no enemy, spaced from other doctors)
    if(!x.enemy&&!x.doctor&&!nearbyHas("doctor",2)&&Math.random()<0.05){
      x.doctor=spawnDoctor();
    }
  }

  // --- KILL STREAK DECAY (enemy-free wandering) ---
  // A streak only stays hot while you keep finding things to fight. Enter too
  // many rooms in a row without a live enemy and the streak goes cold.
  // Base grace = 3 enemy-free rooms; a lucky roll (Luck-scaled) can grant a 4th.
  if(x.enemy&&x.enemy.hp>0){
    // A fight is on — streak is safe, reset the idle counter.
    S.roomsSinceKill=0;
  } else if((S.killStreak||0)>0){
    S.roomsSinceKill=(S.roomsSinceKill||0)+1;
    // Luck gives a chance to earn one extra grace room before the streak breaks.
    let luck=(typeof eff==="function"?(eff().luck||0):0);
    let luckyGrace=Math.random()<Math.min(0.5,0.10+luck*0.02); // 10% base, +2%/luck, cap 50%
    let graceRooms=luckyGrace?4:3;
    if(S.roomsSinceKill>graceRooms){
      breakStreak("no prey found for too long");
    }
  }

  // --- FLOOR COMPLETION CHECK ---
  // If all exits are explored/blocked and no ladder down exists, spawn a portal
  checkFloorEscape();

  save();render();
}

// Additional flat bonus to search d20 rolls from ring/amulet traits
function searchBonus(){
  let b=0;
  if(hasTrait("Lucky Find")) b+=2;
  if(hasTrait("Treasure Sense")) b+=2;
  if(hasTrait("Arcane Loop")) b+=S.equipment.rings.filter(x=>x).length; // INT×rings proxy: +1 per ring
  return b;
}

function search(){let r=room();if(r.enemy&&r.enemy.hp>0)return msg("⚔️ Search is unavailable during combat.");if(r.searched)return;r.searched=true;

  // --- QUEST ITEM DISCOVERY (d20 based) ---
  // Items can ONLY be found on the quest's target floor (or current floor for "same floor" quests)
  let activeQuests=S.quests.filter(qq=>{
    if(qq.found) return false;
    let onFloor=(qq.targetFloor===S.floor||(!qq.targetFloor&&qq.npcFloor===S.floor));
    if(!onFloor) return false;
    // Must be at least a few rooms away from the quest-giver — never the same or
    // adjacent room. For same-floor quests, require Manhattan distance >= 3 from the NPC.
    if((qq.targetFloor||qq.npcFloor)===qq.npcFloor){
      let dist=Math.abs(S.x-qq.npcX)+Math.abs(S.y-qq.npcY);
      if(dist<3) return false;
    }
    return true;
  });
  if(activeQuests.length>0){
    let searchRoll=d20()+searchBonus();
    let quest=activeQuests[Math.floor(Math.random()*activeQuests.length)];
    // Base threshold — easier to find on the correct floor (you're in the right place!)
    let findThreshold=12;
    // INT bonus helps searching
    findThreshold-=Math.floor(eff().int/15);
    // Quest Compass: makes quest items much easier to discover
    if(hasTrait("Quest Compass")) findThreshold-=4;
    // Clamp minimum
    findThreshold=Math.max(4,findThreshold);

    if(searchRoll===20){
      // CRITICAL SUCCESS — always find it
      quest.found=true;
      msg(`💥 CRITICAL SEARCH! You discover the ${quest.itemName} in a hidden alcove! ✅ Ready to deliver.`);
      save();render();return;
    } else if(searchRoll>=findThreshold){
      // Normal success — find the quest item
      quest.found=true;
      msg(`🔎 You find the ${quest.itemName}! ✅ Ready to deliver.`);
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

  // --- QUICK-TRAVEL PORTAL DISCOVERY (max 1 per floor) ---
  // Replaces the old "secret passage unblocks a wall" system. Finding a portal
  // adds a NAMED quick-travel node to the Portals section. Only ONE portal can
  // exist per floor, and discovery is rare (Luck raises it a little) so portals
  // stay special — you might find one on floor 1, another on 3, another on 7.
  let floorHasPortal=(S.portals||[]).some(p=>p.floor===S.floor);
  if(!floorHasPortal && !r.portal){
    // ~14% base chance, +1%/Luck (cap 30%). Rare enough to feel like a discovery.
    let portalChance=Math.min(0.30,0.14+(eff().luck||0)*0.01);
    if(Math.random()<portalChance){
      let element=questPrefixes[Math.floor(Math.random()*questPrefixes.length)];
      let name=`${element} Floor ${S.floor} Portal`;
      let portal={name,floor:S.floor,x:S.x,y:S.y,art:"🌀"};
      if(!S.portals) S.portals=[];
      S.portals.push(portal);
      r.portal=portal;               // mark room so the map shows it
      msg(`🌀 SECRET PASSAGE! You uncover a shimmering gateway — the ${name}. It's now saved to your Portals for instant quick-travel.`);
      if(typeof checkAchievements==="function") checkAchievements();
      save();render();return;
    }
  }

  // --- NORMAL SEARCH RESULTS (d20 based) ---
  let searchRoll=d20()+Math.floor((eff().int||1)/10)+searchBonus(); // INT bonus: +1 per 10 INT, plus trait bonuses
  // Anti double-dip: a room you already cleared by combat was "guarded loot" —
  // searching it afterward yields much less (the enemy WAS the reward).
  if(r.hadEnemy) searchRoll-=8;

  if(searchRoll===20||searchRoll>=20){
    // CRITICAL LOOT SUCCESS — legendary find, biased toward rings!
    let critType=Math.random()<0.4?"ring":types[Math.floor(Math.random()*types.length)];
    let i=makeLegendaryItem(critType);
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
    // Normal loot — but sometimes a trinket or mystery potion instead
    let roll=Math.random();
    // Trinket Collector: doubles the chance of finding a trinket/potion
    let tc=hasTrait("Trinket Collector")?2:1;
    if(roll<0.12*tc){ findTrinket(); return; }
    if(roll<0.24*tc){ findMysteryPotion(); return; }
    let i=makeItem(types[Math.floor(Math.random()*types.length)]);
    msg(`🎁 ${i.name} found. ${obtain(i)}`);
    return;
  }
  if(searchRoll>=6){
    // Chance of finding gold, otherwise nothing
    if(Math.random()<0.5){
      let goldFind=Math.max(1,Math.round(Math.pow(S.floor,1.2)*(0.8+Math.random()*1.5)));
      S.gold=(S.gold||0)+goldFind;
      S.goldEarned=(S.goldEarned||0)+goldFind;
      msg(`💰 You find a stash of ${goldFind} gold!`);
      if(typeof checkAchievements==="function") checkAchievements();
    } else {
      msg("🔎 You find nothing of interest.");
    }
    return;
  }
  if(searchRoll>=2){
    // Trap! DEX gives a chance to dodge it
    let trapDodge=Math.min(0.35,(eff().dex||1)*0.015); // +1.5% per DEX, max 35%
    if(Math.random()<trapDodge){
      msg("⚠️ A trap triggers but you leap aside unharmed! (DEX)");
      return;
    }
    let trapDmg=Math.max(1,Math.round(Math.pow(S.floor,1.2)*0.2));
    msg(`⚠️ A hidden trap strikes! You take ${trapDmg} damage. (HP ${Math.max(0,S.hp-trapDmg)}/${effMaxHp()})`);
    damage(trapDmg);
    if(S.floor>2&&S.hp>0&&Math.random()<0.12)loseFinger();
    return;
  }
  // searchRoll === 1: Critical fail (already handled above for quests, this is fallback)
  let critTrapDmg=Math.max(2,Math.round(Math.pow(S.floor,1.2)*0.3));
  msg(`⚠️ A vicious hidden trap strikes! You take ${critTrapDmg} damage. (HP ${Math.max(0,S.hp-critTrapDmg)}/${effMaxHp()})`);
  damage(critTrapDmg);
  if(S.floor>2&&S.hp>0&&Math.random()<0.15)loseFinger();
  }

function useLadder(dir){
  let r=room();
  if(!r.ladder||r.ladder.dir!==dir)return;

  // Toll ladder: must pay gold once to unlock it. The price escalates every
  // time you pay a toll this run — each toll paid raises the cost of the next
  // by 50% (compounding). Once THIS ladder is paid it stays free forever.
  if(r.ladder.toll&&!r.ladder.tollPaid){
    let cost=Math.round(r.ladder.toll*Math.pow(1.5,S.tollsPaid||0));
    if((S.gold||0)<cost){
      msg(`🚧 This ladder is toll-gated — it costs ${cost} 💰 to pass. You only have ${S.gold||0}. Earn more gold or find another way.`);
      return;
    }
    S.gold-=cost;
    S.goldSpent=(S.goldSpent||0)+cost;
    S.tollsPaid=(S.tollsPaid||0)+1;
    r.ladder.tollPaid=true;
    msg(`💰 You pay the ${cost} gold toll. The ladder mechanism unlocks. (Toll #${S.tollsPaid} — the next toll will cost more.)`);
  }

  // Mark this ladder as used (green)
  r.ladder.used=true;
  let sourceKey=key();

  // Move to target floor
  let targetFloor=dir==="down"?S.floor+1:S.floor-1;
  if(targetFloor<1)return;

  S.floor=targetFloor;
  if(targetFloor>(S.deepestFloor||1)) S.deepestFloor=targetFloor;
  if(typeof checkAchievements==="function") checkAchievements();

  // Check if this ladder already has a paired destination
  if(r.ladder.targetKey&&S.rooms[r.ladder.targetKey]){
    // Go to the paired room
    let parts=r.ladder.targetKey.split(":");
    S.x=parseInt(parts[1]);
    S.y=parseInt(parts[2]);
    let targetRoom=S.rooms[r.ladder.targetKey];
    if(targetRoom.ladder) targetRoom.ladder.used=true;
  } else {
    // First time using this ladder — create a NEW unique destination
    // Find a position not already used by another ladder on the target floor
    let destX,destY,destKey;
    let attempts=0;
    do{
      // Random position spread out from origin (farther = more isolated "islands")
      destX=Math.floor(Math.random()*20)-10;
      destY=Math.floor(Math.random()*20)-10;
      destKey=`${targetFloor}:${destX}:${destY}`;
      attempts++;
    } while(S.rooms[destKey]&&attempts<50); // Don't land on existing room

    S.x=destX;
    S.y=destY;
    let newRoom=room(); // Creates the room at this position

    // Place a return ladder in the new room pointing back
    newRoom.ladder={dir:dir==="down"?"up":"down",used:true,targetKey:sourceKey};

    // Link source ladder to this new room
    r.ladder.targetKey=destKey;
  }

  msg(dir==="down"?`🟨 You descend to floor ${S.floor}.`:`🟩 You ascend to floor ${S.floor}.`);
}

// --- QUICK-TRAVEL PORTALS ---
// Click a portal to teleport to it instantly; click it again (while standing on
// it) to return to wherever you were when you left. Works across floors.
function quickTravel(idx){
  if(S.hp<=0) return;
  let r=room();
  if(r.enemy&&r.enemy.hp>0) return msg("⚔️ You can't quick-travel while a foe blocks the chamber!");
  let p=(S.portals||[])[idx];
  if(!p) return;

  // Standing ON this portal? Then this click is a RETURN trip.
  let onThisPortal=(S.floor===p.floor&&S.x===p.x&&S.y===p.y);
  if(onThisPortal){
    if(S.quickTravelReturn){
      let ret=S.quickTravelReturn;
      S.quickTravelReturn=null;
      S.floor=ret.floor; S.x=ret.x; S.y=ret.y;
      room(); // ensure the room exists
      if(S.floor>(S.deepestFloor||1)) S.deepestFloor=S.floor;
      msg(`🌀 You step back through the ${p.name}, returning to where you were.`);
      save();render();
    } else {
      msg(`🌀 You're already standing at the ${p.name}. Travel from elsewhere to use it.`);
    }
    return;
  }

  // Otherwise: save current position as the return point and teleport TO the portal.
  S.quickTravelReturn={floor:S.floor,x:S.x,y:S.y};
  S.floor=p.floor; S.x=p.x; S.y=p.y;
  room(); // ensure the room exists
  msg(`🌀 You slip through the ${p.name} to Floor ${p.floor}. Click it again to return.`);
  save();render();
}

function act(a){if(S.hp<=0)return;S.actions=(S.actions||0)+1;if(a==="search")search();else if(a==="fight")fight();else if(a==="flee")flee();else if(["N","S","E","W"].includes(a))move(a);else if(a==="down")useLadder("down");else if(a==="up")useLadder("up");save();render()}

function newRun(){
  // If the current run has made any progress and the hero is still alive,
  // submit it to the Hall of Fame before wiping (giving up still counts).
  let hasProgress=S.xp>0||S.floor>1||(S.totalKills||0)>0;
  let alreadyDead=S.hp<=0; // dead runs already submitted via damage()
  if(hasProgress&&!alreadyDead){
    if(!confirm("Give up this expedition?\n\nYour run will be submitted to the GLOBAL Hall of Fame — but only the top 10 runs WORLDWIDE are shown. You'll only appear if your score beats other players across the world.\n\nProceed and start a new run?")) return;
    submitToGlobalHall().then(()=>{
      localStorage.removeItem(KEY);
      S=fresh();
      render();
      fetchGlobalHall().then(()=>applyHeroNumeral());
    });
    return;
  }
  // No meaningful progress (or already dead & submitted) — just start fresh
  localStorage.removeItem(KEY);
  S=fresh();
  render();
  fetchGlobalHall().then(()=>applyHeroNumeral());
}

function setNickname(val){
  S.nickname=val.trim().slice(0,20);
  save();
}

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

// --- STAT BOOST PER TURN ---
// After each action, player can pick one stat to boost by 1
// S.statBoostAvailable = true means player hasn't picked yet this turn

function renderStatButtons(){
  // Stats are green/clickable when: stat points available OR initial boost available
  let hasPoints=(S.statPoints||0)>0;
  let hasInitialBoost=S.statBoostAvailable;
  let available=(hasPoints||hasInitialBoost)&&S.hp>0;
  let label=hasPoints?`(${S.statPoints} pts)`:"(+1)";
  let E=eff();
  return["str","dex","int","cha"].map(k=>{
    let base=S.stats[k]||0;
    let total=E[k]||0;
    let bonus=total-base;
    // Show "STR 12 (+8)" when gear adds to the base
    let display=bonus>0?`${k.toUpperCase()} ${total} <span class="stat-bonus">(+${bonus})</span>`:`${k.toUpperCase()} ${total}`;
    if(available){
      let pts=S.statPoints||0;
      // Clicking the stat body = +1 (also the single initial free boost).
      // +5 and +10 mini-buttons appear when enough points are banked.
      let bulk="";
      if(hasPoints){
        if(pts>=5) bulk+=`<button class="mini-stat mini-stat-5" onclick="event.stopPropagation();boostStat('${k}',5)">+5</button>`;
        if(pts>=10) bulk+=`<button class="mini-stat mini-stat-10" onclick="event.stopPropagation();boostStat('${k}',10)">+10</button>`;
      }
      return`<div class="stat-btn stat-available" onclick="boostStat('${k}',1)">${display} <span class="boost-hint">${label}</span>${bulk?`<div class="bulk-row">${bulk}</div>`:""}</div>`;
    }
    return`<div class="stat-btn">${display}</div>`;
  }).join("");
}

function boostStat(stat,amount){
  if(S.hp<=0)return;
  amount=amount||1;
  if(S.statBoostAvailable){
    // Initial run boost is a single +1 (ignore larger amounts here)
    S.stats[stat]+=1;
    S.statBoostAvailable=false;
  } else if((S.statPoints||0)>0){
    // Spend up to `amount` level-up points (capped by what's available)
    let spend=Math.min(amount,S.statPoints);
    S.stats[stat]+=spend;
    S.statPoints-=spend;
  } else {
    return;
  }
  save();render();
}
window.boostStat=boostStat;

// --- STARTER RING CHOICE ---
// At the start of each run, pick 1 of 3 unique starter rings

function showStarterRingChoice(){
  if(S.starterRingPicked)return;
  // Pick 3 random unique options
  let options=[];
  let pool=[...starterRings];
  for(let i=0;i<3&&pool.length>0;i++){
    let idx=Math.floor(Math.random()*pool.length);
    let ring={...pool.splice(idx,1)[0]};
    // Add periodic table element for uniqueness
    let element=questPrefixes[Math.floor(Math.random()*questPrefixes.length)];
    ring.name=`${element} ${ring.name}`;
    options.push(ring);
  }
  S._starterOptions=options; // temp store

  let html=`<div class="discard-overlay" id="starterRingModal">
    <div class="discard-box">
      <h3>💍 Choose Your Heirloom Ring</h3>
      <p>Every Dwarf carries a family ring into the dungeon. Choose wisely — it will shape your journey.</p>
      <div class="starter-ring-options">${options.map((r,i)=>`<div class="starter-ring-card" onclick="pickStarterRing(${i})">
        <span class="art">${r.art}</span>
        <b>${r.name}</b>
        <div>${Object.entries(r.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
        <div class="trait">⚡ ${r.trait}</div>
        <div class="small">${r.desc}</div>
      </div>`).join("")}</div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

function pickStarterRing(idx){
  let modal=document.getElementById("starterRingModal");
  if(modal)modal.remove();
  if(!S._starterOptions)return;

  let chosen=S._starterOptions[idx];
  // Create the actual ring item
  let ring={
    id:crypto.randomUUID(),
    type:"ring",
    name:chosen.name,
    rarity:"uncommon",
    depth:"bronze",
    art:chosen.art,
    stats:{...chosen.stats},
    trait:chosen.trait
  };
  // Apply luck stat if present
  if(ring.stats.luck){
    S.stats.luck=(S.stats.luck||0)+ring.stats.luck;
    delete ring.stats.luck;
  }
  // Equip on first finger
  S.equipment.rings[0]=ring;
  S.starterRingPicked=true;
  delete S._starterOptions;
  msg(`💍 You wear your heirloom: ${chosen.name}. "${chosen.desc}"`);
  save();render();
}
window.pickStarterRing=pickStarterRing;

function render(){
  let r=room();
  intro.textContent=`${S.name} · Floor ${S.floor}`;
  // Sync nickname input (don't overwrite if user is typing)
  let ni=document.getElementById("nicknameInput");
  if(ni&&document.activeElement!==ni) ni.value=S.nickname||"";
  let sc=document.getElementById("showCountry");
  if(sc) sc.checked=!!(S.country);
  // XP progress toward next level — always a clean per-level 0→100% (resets each level)
  let curThresh=S.level>1?xpForLevel(S.level-1):0; // XP at start of current level
  let nextThresh=xpForLevel(S.level);              // XP needed for next level
  let span=Math.max(1,nextThresh-curThresh);
  let into=Math.max(0,Math.min(span,S.xp-curThresh)); // clamp within this level for display
  let pct=Math.round(into/span*100);
  let xpBar=`<div class="xp-wrap"><div class="xp-label">⭐ Level ${S.level} · XP ${into}/${span} to next</div><div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div></div>`;
  stats.innerHTML=[`❤️ HP ${Math.max(0,S.hp)}/${effMaxHp()}`,`🍀 Luck ${eff().luck||0}`,`💰 ${S.gold}`].map(x=>`<div>${x}</div>`).join("")+renderStatButtons();
  xpbar.innerHTML=xpBar;
  roomTitle.textContent=`Floor ${S.floor} — Chamber`;
  roomText.textContent=r.enemy&&r.enemy.hp>0?`⚔️ ${r.enemy.name} (${r.enemy.hp} HP)${r.enemy.element?` [${r.enemy.element}]`:""}${r.enemy.isBoss?` 👑 BOSS — ${r.enemy.abilities.join(" | ")}`:""} blocks the chamber.`:r.npc&&!r.npc.completed?`🔵 ${r.npc.name}, ${r.npc.title}, is here.`:r.trader?`💲 ${r.trader.name}, ${r.trader.title}, awaits.`:r.doctor?`⚕️ ${r.doctor.name}, ${r.doctor.title}, tends the wounded here.`:r.rest&&!r.rest.depleted?`${r.rest.emoji} A ${r.rest.name} flows here. (${r.rest.sips} sips remain)`:"The chamber is quiet.";
  map.innerHTML=drawMap();
  if(r.enemy&&r.enemy.hp>0){
    let bossBanner=r.enemy.isBoss?`<div class="boss-banner">👑 BOSS FIGHT — must be defeated to descend</div>`:"";
    actions.innerHTML=bossBanner+`<div class="combat-actions"><button onclick="act('fight')">⚔️ Fight (F)</button><button onclick="act('flee')">🏃 Flee (R)</button></div>`;
  } else {
    let extras="";
    if(!r.searched) extras+=`<button class="action-btn" onclick="act('search')">🔎 Search (E)</button>`;
    if(r.npc&&!r.npc.completed) extras+=`<button class="action-btn npc-btn" onclick="talkNPC()">🔵 Talk (T)</button>`;
    if(r.trader) extras+=`<button class="action-btn trader-btn" onclick="talkTrader()">💲 Trade (T)</button>`;
    if(r.rest&&!r.rest.depleted){
      let restFull=(r.rest.type!=="luck"&&S.hp>=effMaxHp());
      extras+=`<button class="action-btn ${r.rest.type==="luck"?"luck-btn":"rest-btn"}" onclick="useRest()"${restFull?" disabled":""}>${r.rest.type==="luck"?"🍀":"💚"} ${r.rest.name} (${r.rest.sips}/${r.rest.maxSips})${restFull?" — Full HP":" (G)"}</button>`;
    }
    if(r.doctor) extras+=`<button class="action-btn doctor-btn" onclick="talkDoctor()">⚕️ Visit ${r.doctor.name}</button>`;
    if(r.ladder){
      let tollDue=(r.ladder.toll&&!r.ladder.tollPaid)?Math.round(r.ladder.toll*Math.pow(1.5,S.tollsPaid||0)):0;
      let tollLabel=tollDue?` 🚧 ${tollDue}💰`:"";
      let cantAfford=(tollDue&&(S.gold||0)<tollDue);
      extras+=`<button class="action-btn${cantAfford?" toll-locked":""}" onclick="act('${r.ladder.dir}')">🪜 ${r.ladder.dir==="down"?"↓ Descend":"↑ Ascend"}${tollLabel} (Q)</button>`;
    }
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
    let scar=(S.repairedFingers||[]).includes(i);
    if(x) return`<div class="ring-wrap${scar?" scarred":""}">${scar?`<span class="scar-tag" title="Scarred — fragile, may be lost again">🩹</span>`:""}${item(x,false,"ring"+i)}</div>`;
    return`<div class="item${scar?" scarred-empty":""}">${scar?"🩹 ":""}${i+1}. ${scar?"Scarred":"Empty"}</div>`;
  }).join("")}</div>${S.lostFingers&&S.lostFingers.left&&S.lostFingers.left.length>=5?`<div class="small lost-finger">⚠️ Left hand mangled — no shield grip</div>`:""}</div><div class=card><b>RINGS — Right Hand 🫱</b><div class=grid>${S.equipment.rings.slice(5).map((x,i)=>{
    if(isFingerLost(i+5)) return`<div class="item lost-finger">❌ ${i+1}. Lost</div>`;
    let scar=(S.repairedFingers||[]).includes(i+5);
    if(x) return`<div class="ring-wrap${scar?" scarred":""}">${scar?`<span class="scar-tag" title="Scarred — fragile, may be lost again">🩹</span>`:""}${item(x,false,"ring"+(i+5))}</div>`;
    return`<div class="item${scar?" scarred-empty":""}">${scar?"🩹 ":""}${i+1}. ${scar?"Scarred":"Empty"}</div>`;
  }).join("")}</div>${S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5?`<div class="small lost-finger">⚠️ Right hand mangled — no weapon grip</div>`:""}</div>`;
  inventory.innerHTML=S.inventory.length?S.inventory.map(x=>item(x,true,false)).join(""):"<div class=small>Empty</div>";
  // --- QUEST DISPLAY: Active hunts + Completed trophies ---
  let activeHtml=S.quests.length?S.quests.map(q=>{
    let floorHint=q.targetFloor?`Floor ${q.targetFloor}`:(q.difficulty||"?");
    let onCorrectFloor=q.targetFloor===S.floor;
    let npcLoc=q.npcFloor?` · 🔵 ${q.npcName||"NPC"} on Floor ${q.npcFloor}`:"";
    return`<div class="card quest-card ${q.found?"quest-found":""}${!q.found&&onCorrectFloor?" quest-active":""}">
      ${q.found?"✅":"🔎"} <b>${q.itemName}</b>
      <div class="small">${q.found?"Found — return to "+(q.npcName||"the NPC")+" on Floor "+q.npcFloor+"!":`Search on: ${floorHint}${onCorrectFloor?" ← YOU ARE HERE":""}`} · Reward: ${q.xpReward} XP${q.itemReward?" + 🎁":""}</div>
      <div class="small quest-npc-loc">${npcLoc}</div>
      </div>`;
  }).join(""):"<div class=small>No active quests.</div>";

  let completed=S.completedQuests||[];
  let completedHtml=completed.length?`<div class="quest-completed-header">🏆 Completed (${completed.length})</div>`+completed.map(q=>
    `<div class="card quest-card quest-done">🏅 <b>${q.itemName}</b><div class="small">Delivered to ${q.npcName} · +${q.xpAwarded} XP${q.itemReward?" + 🎁":""} · Floor ${q.floor}</div></div>`
  ).join(""):"";

  // Achievement progress banner
  let delivered=S.questsDelivered||0;
  let nextMs=[1,5,10,20,50,100].find(c=>c>delivered);
  let achHtml=`<div class="quest-ach">🏆 Quests delivered: <b>${delivered}</b>${nextMs?` · next reward at ${nextMs}`:" · all milestones earned!"}</div>`;
  quests.innerHTML=achHtml+`<div class="quest-active-header">🔎 Active Quests</div>${activeHtml}${completedHtml}`;
  // --- PORTALS: quick-travel network ---
  let portalsEl=document.getElementById("portals");
  if(portalsEl){
    let ps=S.portals||[];
    if(!ps.length){
      portalsEl.innerHTML=`<div class=small>No portals discovered yet. Search rooms to uncover secret passages (max one portal per floor).</div>`;
    } else {
      portalsEl.innerHTML=ps.map((p,i)=>{
        let here=(S.floor===p.floor&&S.x===p.x&&S.y===p.y);
        let pending=S.quickTravelReturn&&here; // standing on it with a return saved
        let label=here?(S.quickTravelReturn?"↩️ Return":"📍 You are here"):"🌀 Travel";
        return`<div class="card portal-card${here?" portal-here":""}">
          <b>🌀 ${p.name}</b>
          <div class="small">Floor ${p.floor}${here?" · you are here":""}</div>
          <button class="action-btn portal-btn" onclick="quickTravel(${i})">${label}</button>
        </div>`;
      }).join("");
    }
  }
  renderAchievements();
  renderHall();
  // Show starter ring choice if not yet picked
  if(!S.starterRingPicked&&!document.getElementById("starterRingModal")) showStarterRingChoice();
}

function renderAchievements(){
  let el=document.getElementById("achievements");
  if(!el) return;
  let earned=S.achievements||[];
  let total=ACHIEVEMENTS.length;
  let rows=ACHIEVEMENTS.map(a=>{
    let done=earned.includes(a.id);
    let val=metricValue(a.metric);
    let prog=done?"":` <span class="small">(${Math.min(val,a.need)}/${a.need})</span>`;
    return`<div class="card ach-card ${done?"ach-done":"ach-locked"}">
      ${done?"🏅":"🔒"} <b>${a.title}</b> — ${a.desc}${prog}
      ${done?"":`<div class="small">Reward: +${a.xp} XP${a.gold?" · +"+a.gold+" 💰":""}</div>`}
    </div>`;
  }).join("");
  el.innerHTML=rows;
  // Show the unlock count in the collapsible summary so it's visible while collapsed.
  let sum=document.getElementById("achSummary");
  if(sum) sum.textContent=`(${earned.length}/${total} unlocked)`;
}

// --- INIT ---
window.act=act;window.equip=equip;window.unequip=unequip;window.discard=discard;window.discardChoice=discardChoice;window.swapRing=swapRing;window.newRun=newRun;window.talkNPC=talkNPC;window.talkTrader=talkTrader;window.sellItem=sellItem;window.buyItem=buyItem;window.talkDoctor=talkDoctor;window.restoreFingers=restoreFingers;window.doctorHeal=doctorHeal;window.drinkPotion=drinkPotion;window.leavePotion=leavePotion;window.sellFromInventory=sellFromInventory;

// --- SHARE ---
function shareGame(){
  const url=window.location.href.split("?")[0].split("#")[0];
  const text=`⚔️ Play Infinite Dungeon — an endless roguelike dungeon crawler! Compete on the global Hall of Fame: ${url}`;
  // Try native share (mobile), fall back to clipboard
  if(navigator.share){
    navigator.share({title:"Infinite Dungeon",text:"Play Infinite Dungeon and compete on the global Hall of Fame!",url}).catch(()=>{});
  } else if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(()=>{
      alert("🔗 Link copied to clipboard!\n\n"+url+"\n\nShare it with friends to compete on the global Hall of Fame!");
    }).catch(()=>{
      prompt("Copy this link to share:",url);
    });
  } else {
    prompt("Copy this link to share:",url);
  }
}
window.shareGame=shareGame;
window.setNickname=setNickname;
window.toggleCountry=toggleCountry;

// --- KEYBOARD CONTROLS ---
document.addEventListener("keydown",(e)=>{
  // Ignore if typing in an input/textarea (e.g. the nickname tag field)
  let tag=(e.target&&e.target.tagName)?e.target.tagName.toLowerCase():"";
  if(tag==="input"||tag==="textarea"||tag==="select")return;
  // Don't trigger if a modal is open
  if(document.getElementById("discardModal")||document.getElementById("ringSwapModal")||document.getElementById("traderModal")||document.getElementById("doctorModal")||document.getElementById("starterRingModal")||document.getElementById("potionModal"))return;
  if(S.hp<=0)return;

  let r=room();
  let inCombat=r.enemy&&r.enemy.hp>0;

  switch(e.key){
    // WASD + Arrow keys for movement
    case"w":case"W":case"ArrowUp":
      if(!inCombat){act("N");e.preventDefault();}break;
    case"a":case"A":case"ArrowLeft":
      if(!inCombat){act("W");e.preventDefault();}break;
    case"s":case"S":case"ArrowDown":
      if(!inCombat){act("S");e.preventDefault();}break;
    case"d":case"D":case"ArrowRight":
      if(!inCombat){act("E");e.preventDefault();}break;
    // Combat keys
    case"f":case"F":
      if(inCombat)act("fight");break;
    case"r":case"R":
      if(inCombat)act("flee");break;
    // Search
    case"e":case"E":
      if(!inCombat)act("search");break;
    // Talk to NPC / Trader / Doctor
    case"t":case"T":
      if(!inCombat){
        if(r.npc&&!r.npc.completed) talkNPC();
        else if(r.trader) talkTrader();
        else if(r.doctor) talkDoctor();
      }
      break;
    // Use ladder / portal (ascend or descend)
    case"q":case"Q":
      if(!inCombat&&r.ladder) act(r.ladder.dir);
      break;
    // Drink / use a rest source (fountain, stream, luck fountain)
    case"g":case"G":
      if(!inCombat&&r.rest&&!r.rest.depleted) useRest();
      break;
  }
});

// --- XP / LEVEL SAVE NORMALIZATION ---
// The XP curve (xpForLevel) can change between versions (it got ~2.2× steeper in
// v1.1). A save made on an older curve can end up with S.xp BELOW the current
// floor of its stored S.level, which stranded the XP bar at 0/…  (a level-19
// player showing "XP 0/5113"). This one-time pass keeps the player's hard-earned
// LEVEL and rebases S.xp to the floor of that level so the per-level bar (0→100%)
// resumes filling normally. It also promotes if XP now exceeds the level ceiling.
function normalizeXp(){
  if(S.hp<=0) return; // don't touch finished runs
  // 1) If XP sits above the current level's requirement, let the normal loop level up.
  if(typeof checkLevelUp==="function") checkLevelUp();
  // 2) If XP is below the floor of the current level (older, gentler curve),
  //    grandfather the level and rebase XP to that floor so the bar isn't stuck at 0.
  let floorXp=S.level>1?xpForLevel(S.level-1):0;
  if(S.xp<floorXp){
    S.xp=floorXp;
    save();
  }
}
normalizeXp();

render();
fetchSeasons().then(()=>fetchGlobalHall()).then(()=>applyHeroNumeral()); // Fetch seasons + leaderboard, then number the fresh hero
