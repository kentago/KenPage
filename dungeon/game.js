const KEY="infinite-dungeon-v13";
const API_BASE="https://bitter-tree-d030.kesj04.workers.dev";
const dwarves=["Durin Ironbeard","Borin Deepaxe","Kargan Stonepick","Thorin Mountainbeard","Dwalin Blackforge","Farin Axebreaker","Balin Goldvein","Gorin Redhammer"];
const intros=["The old miners spoke of a sealed kingdom beneath the mountains. You entered to discover what survived below.","A forgotten royal expedition vanished beneath the mountain. You descend to learn their fate.","A tremor opened an ancient shaft, and rumors of lost Dwarven treasures followed."];
const types=["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet","ring"];
const names={weapon:["Rusty Sword","Deepforge Axe","Skeleton King's Bone Sword","Goblin Assassin's Poison Dagger"],helmet:["Iron Helm","Dragon's Helmet","Bone Helm"],armor:["Old Mail","Deepplate"],boots:["Miner Boots","Swift Boots"],shoulders:["Iron Pauldrons"],trousers:["Leather Trousers"],cape:["Traveler's Cape","Shadowweave Cape","Dragon Cape"],amulet:["Stone Amulet","Moon Amulet"],ring:["Iron Ring","Moonstone Ring","Bone Ring","Ember Ring","Dwarven Signet"]};
const arts={weapon:["⚔️","🪓","🗡️"],helmet:["🪖","🐉","💀"],armor:["🛡️","🥋"],boots:["🥾","👢"],shoulders:["🛡️","⚔️"],trousers:["👖"],cape:["🧥","🦇"],amulet:["📿","🔮"],ring:["💍","💎","🔴","🔵","🟡","⚪","🟢","🟣","🪨","✨"]};
const rar=["common","uncommon","rare","mythical"], dep=["bronze","silver","gold","titan","glowing"];
let S=JSON.parse(localStorage.getItem(KEY)||"null")||fresh();
let globalHall=[]; // Cached global leaderboard from D1

function fresh(){return{name:dwarves[Math.floor(Math.random()*dwarves.length)],nickname:"",level:1,xp:0,hp:10,maxHp:10,floor:1,x:0,y:0,gold:0,stats:{str:1,dex:1,int:1,cha:1},rooms:{"1:0:0":{searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null}},inventory:[],equipment:{weapon:null,helmet:null,armor:null,boots:null,shoulders:null,trousers:null,cape:null,amulet:null,rings:Array(10).fill(null)},lostFingers:{left:[],right:[]},quests:[],log:[`📖 ${intros[Math.floor(Math.random()*intros.length)]}`]}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function key(){return`${S.floor}:${S.x}:${S.y}`}
function room(){return S.rooms[key()]||(S.rooms[key()]={searched:false,blocked:{},enemy:null,ladder:null,secret:null,npc:null,trader:null})}
function d20(){return 1+Math.floor(Math.random()*20)}
function msg(t){S.log.unshift(t);S.log=S.log.slice(0,100);save();render()}
function makeItem(type){let z=Math.random(),r=z<.65?0:z<.90?1:z<.985?2:3,p=["str","dex","int","cha"],i={id:crypto.randomUUID(),type,name:names[type][Math.floor(Math.random()*names[type].length)],rarity:rar[r],depth:dep[Math.min(4,Math.floor((S.floor-1)/10))],art:arts[type][Math.floor(Math.random()*arts[type].length)],stats:{},trait:null},a=p[Math.floor(Math.random()*4)];i.stats[a]=Math.max(1,Math.round((1+S.floor*.8+S.level*.7)*(.6+Math.random())));if(Math.random()<.55)i.stats[p[Math.floor(Math.random()*4)]]=1+Math.floor(Math.random()*Math.max(1,S.floor/5));if(Math.random()<.18+r*.12)i.trait=["Bone Rend","Grave Fortune","Dragonblood","Veilstep","Deep Luck","Poison Edge"][Math.floor(Math.random()*6)];return i}
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
  return`<div class="item ${i.rarity} ${i.depth}"><span class="art">${i.art}</span><b>${i.name}</b><div>${Object.entries(i.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>${i.trait?`<div>Trait: ${i.trait}</div>`:""}<div class="small">${i.rarity} · ${i.depth}</div>${buttons}</div>`;
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

function spawn(){let early=["Rat","Rat","Rat","Rat","Goblin Assassin","Goblin Assassin","Skeleton King","Basilisk","Medusa"],late=["Rat","Goblin Assassin","Skeleton King","Basilisk","Medusa","Dragon"];let pool=S.floor<=10?early:late;let n=pool[Math.floor(Math.random()*pool.length)];if(Math.random()<0.01)n="Dragon";return{name:n,hp:5+Math.round(S.floor*1.8)}}
function search(){let r=room();if(r.enemy&&r.enemy.hp>0)return msg("⚔️ Search is unavailable during combat.");if(r.searched)return;r.searched=true;let q=Math.random();if(q<.15){r.secret={dir:["N","E","S","W"][Math.floor(Math.random()*4)]};msg("✨ A secret passage is revealed.");return}if(q<.42){let i=makeItem(types[Math.floor(Math.random()*types.length)]);msg(`🎁 ${i.name} found. ${obtain(i)}`);return}if(q<.55){msg("⚠️ A hidden trap strikes.");damage(Math.max(1,d20()%4));if(Math.random()<0.12)loseFinger();return}msg("🔎 You find nothing.")}

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
  }

  save();render();
}

function fight(){let r=room();if(!r.enemy||r.enemy.hp<=0)return;let hit=d20();if(hit===1){msg(`💥 Critical miss! ${r.enemy.name} counterattacks.`);damage(Math.max(1,d20()%5+1));if(Math.random()<0.08)loseFinger();return}
  // Right hand mangled = severely reduced attack
  let rightMangled=S.lostFingers&&S.lostFingers.right&&S.lostFingers.right.length>=5;
  let leftMangled=S.lostFingers&&S.lostFingers.left&&S.lostFingers.left.length>=5;
  let atkBonus=rightMangled?1:Math.floor(S.stats.str/10);
  let n=Math.max(1,d20()%6+atkBonus);
  if(rightMangled) n=Math.max(1,Math.floor(n*0.4)); // 60% damage reduction without weapon hand
  r.enemy.hp=Math.max(0,r.enemy.hp-n);if(r.enemy.hp===0){let defeated=r.enemy.name;r.enemy=null;msg(`☠️ ${defeated} is defeated. The way is open.`)}else{msg(`⚔️ You hit ${r.enemy.name} for ${n}.`);
  // Left hand mangled = take more damage (no shield grip)
  let incomingDmg=Math.max(1,d20()%6);
  if(leftMangled) incomingDmg=Math.ceil(incomingDmg*1.5);
  damage(incomingDmg);}}
function flee(){let r=room();if(!r.enemy||r.enemy.hp<=0)return;let n=d20();if(n===20)return msg("🏃 Critical escape! No consequence.");if(n<=4){msg("🏃 Failed escape! The foe counterattacks.");damage(Math.max(1,d20()%5+1));return}if(n<=9){msg("🏃 You escape but take damage.");damage(Math.max(1,d20()%4+1));return}if(n<=13){msg("🏃 You escape but suffer a lingering consequence.");damage(1);return}msg("🏃 You escape successfully.")}
function act(a){if(S.hp<=0)return;if(a==="search")search();else if(a==="fight")fight();else if(a==="flee")flee();else if(["N","S","E","W"].includes(a))move(a);else if(a==="down"){S.floor++;S.x=0;S.y=0;room();msg(`🟨 You descend to floor ${S.floor}.`)}else if(a==="up"&&S.floor>1){S.floor--;S.x=0;S.y=0;room();msg(`🟩 You ascend to floor ${S.floor}.`)}save();render()}
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
        } else if(rm.ladder==="down"){
          symbol="🪜↓";
          cellClass+=" ladder-down";
        } else if(rm.ladder==="up"){
          symbol="🪜↑";
          cellClass+=" ladder-up";
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
  roomText.textContent=r.enemy&&r.enemy.hp>0?`⚔️ ${r.enemy.name} blocks the chamber.`:"The chamber is quiet.";
  map.innerHTML=drawMap();
  actions.innerHTML=r.enemy&&r.enemy.hp>0?`<button onclick="act('fight')">⚔️ Fight</button><button onclick="act('flee')">🏃 Flee</button>`:`<button onclick="act('N')">W · North</button><button onclick="act('W')">A · West</button><button onclick="act('S')">S · South</button><button onclick="act('E')">D · East</button>${r.searched?"":`<button onclick="act('search')">🔎 Search</button>`}${r.ladder?`<button onclick="act('${r.ladder}')">🪜 ${r.ladder==="down"?"↓ Descend":"↑ Ascend"}</button>`:""}`;
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
  quests.innerHTML=S.quests.length?S.quests.map(q=>`<div class=card>${q.found?"✅":"🔎"} ${q.itemName}</div>`).join(""):"<div class=small>No active quests.</div>";
  renderHall();
}

// --- INIT ---
window.act=act;window.equip=equip;window.unequip=unequip;window.discard=discard;window.discardChoice=discardChoice;window.swapRing=swapRing;window.newRun=newRun;
render();
fetchGlobalHall(); // Fetch global leaderboard on page load
