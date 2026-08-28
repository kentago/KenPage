// --- CORE GAME STATE ---
let S=JSON.parse(localStorage.getItem(KEY)||"null")||fresh();

function fresh(){return{name:dwarves[Math.floor(Math.random()*dwarves.length)],nickname:"",level:1,xp:0,hp:10,maxHp:10,floor:1,x:0,y:0,prevX:0,prevY:0,gold:0,stats:{str:1,dex:1,int:1,cha:1},statBoostAvailable:true,starterRingPicked:false,statPoints:0,killStreak:0,bestKillStreak:0,totalKills:0,actions:0,rooms:{"1:0:0":{searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null,rest:null,doctor:null}},inventory:[],equipment:{weapon:null,helmet:null,armor:null,boots:null,shoulders:null,trousers:null,cape:null,amulet:null,rings:Array(10).fill(null)},lostFingers:{left:[],right:[]},fingersRestored:0,floorPositions:{},quests:[],log:[`📖 ${intros[Math.floor(Math.random()*intros.length)]}`]}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function key(){return`${S.floor}:${S.x}:${S.y}`}
function room(){return S.rooms[key()]||(S.rooms[key()]={searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null,rest:null,doctor:null})}
function d20(){return 1+Math.floor(Math.random()*20)}
function msg(t){S.log.unshift(t);S.log=S.log.slice(0,100);save();render()}

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
      // Boss floors (every 5th floor) — boss guards the first ladder
      if(S.floor%5===0&&!floorHasBoss()){
        x.enemy=spawnBoss();
        msg(`⚠️ A powerful guardian blocks the descent!`);
      }
    }
    // Spawn rest source? (~7% chance)
    if(!x.rest&&Math.random()<0.07){
      x.rest=spawnRestSource();
    }
    // Spawn doctor? (~5% chance, only if no enemy)
    if(!x.enemy&&!x.doctor&&Math.random()<0.05){
      x.doctor=spawnDoctor();
    }
  }

  // --- FLOOR COMPLETION CHECK ---
  // If all exits are explored/blocked and no ladder down exists, spawn a portal
  checkFloorEscape();

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
    findThreshold-=Math.floor(eff().int/15);
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
  // INT increases secret passage discovery: base 10% + 0.5% per INT
  let secretChance=0.10+Math.min(0.15,(eff().int||1)*0.005);
  if(!r.secret&&Math.random()<secretChance){
    // A secret passage opens a NEW route — unblocks a direction (both sides)
    let blockedDirs=["N","E","S","W"].filter(d=>r.blocked&&r.blocked[d]);
    let openDir=blockedDirs.length>0
      ? blockedDirs[Math.floor(Math.random()*blockedDirs.length)]
      : ["N","E","S","W"][Math.floor(Math.random()*4)];
    // Remove the wall on this side
    if(r.blocked) delete r.blocked[openDir];
    // Remove reciprocal wall on the neighbor (if it exists)
    let nx=S.x+DIR_DX[openDir], ny=S.y+DIR_DY[openDir];
    let nk=`${S.floor}:${nx}:${ny}`;
    if(S.rooms[nk]&&S.rooms[nk].blocked) delete S.rooms[nk].blocked[OPP[openDir]];
    // Mark for map display + quest bonus
    r.secret={dir:openDir,opened:true};
    let dirName={N:"north",S:"south",E:"east",W:"west"}[openDir];
    msg(`✨ A secret passage opens to the ${dirName}! A hidden route is revealed.`);
    save();render();return;
  }

  // --- NORMAL SEARCH RESULTS (d20 based) ---
  let searchRoll=d20()+Math.floor((eff().int||1)/10); // INT bonus: +1 per 10 INT

  if(searchRoll===20||searchRoll>=20){
    // CRITICAL LOOT SUCCESS — legendary find, biased toward rings!
    let critType=Math.random()<0.4?"ring":types[Math.floor(Math.random()*types.length)];
    let i=makeLegendaryItem();
    i.type=critType;
    i.name=critType==="ring"?`${questPrefixes[Math.floor(Math.random()*questPrefixes.length)]} ${names.ring[Math.floor(Math.random()*names.ring.length)]}`:i.name;
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
    if(roll<0.12){ findTrinket(); return; }
    if(roll<0.24){ findMysteryPotion(); return; }
    let i=makeItem(types[Math.floor(Math.random()*types.length)]);
    msg(`🎁 ${i.name} found. ${obtain(i)}`);
    return;
  }
  if(searchRoll>=6){
    // Chance of finding gold, otherwise nothing
    if(Math.random()<0.5){
      let goldFind=Math.max(1,Math.round(Math.pow(S.floor,1.2)*(0.8+Math.random()*1.5)));
      S.gold=(S.gold||0)+goldFind;
      msg(`💰 You find a stash of ${goldFind} gold!`);
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
    msg(`⚠️ A hidden trap strikes! You take ${trapDmg} damage. (HP ${Math.max(0,S.hp-trapDmg)}/${S.maxHp})`);
    damage(trapDmg);
    if(S.hp>0&&Math.random()<0.12)loseFinger();
    return;
  }
  // searchRoll === 1: Critical fail (already handled above for quests, this is fallback)
  let critTrapDmg=Math.max(2,Math.round(Math.pow(S.floor,1.2)*0.3));
  msg(`⚠️ A vicious hidden trap strikes! You take ${critTrapDmg} damage. (HP ${Math.max(0,S.hp-critTrapDmg)}/${S.maxHp})`);
  damage(critTrapDmg);
  if(S.hp>0&&Math.random()<0.15)loseFinger();
  }

function useLadder(dir){
  let r=room();
  if(!r.ladder||r.ladder.dir!==dir)return;

  // Mark this ladder as used (green)
  r.ladder.used=true;
  let sourceKey=key();

  // Move to target floor
  let targetFloor=dir==="down"?S.floor+1:S.floor-1;
  if(targetFloor<1)return;

  S.floor=targetFloor;

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
      fetchGlobalHall();
    });
    return;
  }
  // No meaningful progress (or already dead & submitted) — just start fresh
  localStorage.removeItem(KEY);
  S=fresh();
  render();
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
      return`<div class="stat-btn stat-available" onclick="boostStat('${k}')">${display} <span class="boost-hint">${label}</span></div>`;
    }
    return`<div class="stat-btn">${display}</div>`;
  }).join("");
}

function boostStat(stat){
  if(S.hp<=0)return;
  if(S.statBoostAvailable){
    // Initial run boost (+1, one-time)
    S.stats[stat]+=1;
    S.statBoostAvailable=false;
  } else if((S.statPoints||0)>0){
    // Level-up stat points
    S.stats[stat]+=1;
    S.statPoints--;
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
  stats.innerHTML=[`❤️ HP ${Math.max(0,S.hp)}/${S.maxHp}`,`⭐ Level ${S.level}`,`XP ${S.xp}`,`🍀 Luck ${eff().luck||0}`].map(x=>`<div>${x}</div>`).join("")+renderStatButtons()+`<div>💰 ${S.gold}</div>`;
  roomTitle.textContent=`Floor ${S.floor} — Chamber`;
  roomText.textContent=r.enemy&&r.enemy.hp>0?`⚔️ ${r.enemy.name} (${r.enemy.hp} HP)${r.enemy.element?` [${r.enemy.element}]`:""}${r.enemy.isBoss?` 👑 BOSS — ${r.enemy.abilities.join(" | ")}`:""} blocks the chamber.`:r.npc&&!r.npc.completed?`🔵 ${r.npc.name}, ${r.npc.title}, is here.`:r.trader?`💲 ${r.trader.name}, ${r.trader.title}, awaits.`:r.doctor?`⚕️ ${r.doctor.name}, ${r.doctor.title}, tends the wounded here.`:r.rest&&!r.rest.depleted?`${r.rest.emoji} A ${r.rest.name} flows here. (${r.rest.sips} sips remain)`:"The chamber is quiet.";
  map.innerHTML=drawMap();
  if(r.enemy&&r.enemy.hp>0){
    actions.innerHTML=`<div class="combat-actions"><button onclick="act('fight')">⚔️ Fight (F)</button><button onclick="act('flee')">🏃 Flee (R)</button></div>`;
  } else {
    let extras="";
    if(!r.searched) extras+=`<button class="action-btn" onclick="act('search')">🔎 Search (E)</button>`;
    if(r.npc&&!r.npc.completed) extras+=`<button class="action-btn npc-btn" onclick="talkNPC()">🔵 Talk (T)</button>`;
    if(r.trader) extras+=`<button class="action-btn trader-btn" onclick="talkTrader()">💲 Trade (T)</button>`;
    if(r.rest&&!r.rest.depleted) extras+=`<button class="action-btn ${r.rest.type==="luck"?"luck-btn":"rest-btn"}" onclick="useRest()">${r.rest.type==="luck"?"🍀":"💚"} ${r.rest.name} (${r.rest.sips}/${r.rest.maxSips})</button>`;
    if(r.doctor) extras+=`<button class="action-btn doctor-btn" onclick="talkDoctor()">⚕️ Visit ${r.doctor.name}</button>`;
    if(r.ladder) extras+=`<button class="action-btn" onclick="act('${r.ladder.dir}')">🪜 ${r.ladder.dir==="down"?"↓ Descend":"↑ Ascend"} (Q)</button>`;
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
  // Show starter ring choice if not yet picked
  if(!S.starterRingPicked&&!document.getElementById("starterRingModal")) showStarterRingChoice();
}

// --- INIT ---
window.act=act;window.equip=equip;window.unequip=unequip;window.discard=discard;window.discardChoice=discardChoice;window.swapRing=swapRing;window.newRun=newRun;window.talkNPC=talkNPC;window.talkTrader=talkTrader;window.sellItem=sellItem;window.buyItem=buyItem;window.talkDoctor=talkDoctor;window.restoreFingers=restoreFingers;window.drinkPotion=drinkPotion;window.leavePotion=leavePotion;

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
  }
});

render();
fetchSeasons().then(()=>fetchGlobalHall()); // Fetch seasons + leaderboard on page load
