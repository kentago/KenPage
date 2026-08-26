const SAVE_KEY="infinite-dungeon-v11";
const DIRS={N:[0,-1,"W"],E:[1,0,"D"],S:[0,1,"S"],W:[-1,0,"A"]};
const monsters=[["Goblin Scout",1,"goblin"],["Cave Rat",1,"rat"],["Mine Spider",2,"spider"],["Skeleton",2,"skeleton"],["Kobold Trapper",2,"kobold"],["Basilisk",5,"basilisk"],["Medusa",6,"medusa"],["Dragon",10,"dragon"],["Skeleton King",9,"skeletonKing"]];
const names=["Durin","Borin","Rurik","Thrain","Balin","Dwalin","Fundin","Brokk","Eitri","Thorin","Oin","Gloin"];
const beards=["Ironbeard","Stonebeard","Frostbeard","Ashbeard","Blackbeard","Greybeard","Longbeard","Redbeard","Goldbeard"];
const openings=[
["THE CALL OF THE DEEP","The mountain has begun whispering again."],
["THE BLACK SEAL","An old royal mark has appeared where no living dwarf remembers seeing it."],
["THE BELLS OF IRONHOLD","The bells below the mountain have rung for seven nights without a hand touching them."],
["THE FORGOTTEN VEIN","Ore has begun appearing in a mine sealed for generations."]
];
const motives=["seek gold","restore a disgraced clan","find a missing relative","prove your worth to the guild","find a legendary weapon","follow a family map","seek glory","answer the call of the deep"];
const causes=["miners have disappeared","an ancient dwarven gate has opened","strange bells have begun ringing underground","an abandoned mine has started producing ore again","a wounded messenger has returned from sealed tunnels","voices have been heard beneath the mountain"];
const beliefs=["an ancient dwarven king has awakened","something is digging upward","the dead miners are not dead","an old enemy has returned","a forgotten mine has been reopened","nobody knows what lies below"];
const rare=[
["Skeleton King's Bone Sword",7,"weapon","The sword remembers every king it has served.",500],
["Goblin Assassin's Poison Dagger",5,"weapon","Its venom lingers after the wound.",420],
["Dragon's Ember Helm",8,"helmet","The metal remains warm in the deepest cold.",650],
["Basilisk-Eye Amulet",6,"amulet","Its glassy eye seems to notice hidden things.",550],
["Medusa's Gorgon Ring",6,"ring","Fear itself hesitates around its wearer.",600]
];
const common=[
["Rusty Sword",2,"weapon","",18],["Iron Axe",2,"weapon","",28],["Mine Pickaxe",1,"weapon","",12],
["Leather Helm",1,"helmet","",15],["Chain Shirt",2,"body","",35],["Traveler's Boots",1,"boots","",22],
["Old Cape",1,"cape","",20],["Iron Ring",1,"ring","",16],["Miner's Amulet",1,"amulet","",24],
["Fine Dwarven Axe",4,"weapon","Balanced and dependable.",90]
];
function r(n=20){return Math.floor(Math.random()*n)+1}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function id(){return Math.random().toString(16).slice(2,6).toUpperCase()+"-"+Math.random().toString(16).slice(2,6).toUpperCase()}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function cap(x){return x[0].toUpperCase()+x.slice(1)}
function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d}
function newGame(){
 const op=pick(openings);
 return {hero:`${pick(names)} ${pick(beards)}`,nickname:"",showCountry:false,country:"",
 expeditionId:id(),expeditionTitle:op[0],opening:`${cap(pick(causes))}. You descend because you ${pick(motives)}. The elders whisper that ${pick(beliefs)}.`,
 level:1,xp:0,hp:10,maxHp:10,floor:1,x:0,y:0,gold:100,stats:{int:1,str:1,cha:1,dex:1},
 inventory:[],quests:[],equipment:{amulet:null,helmet:null,body:null,boots:null,shoulders:null,legs:null,cape:null,rings:Array(10).fill(null)},
 fingers:Array(10).fill(true),rooms:{},logs:[],rareLuck:0,intro:true,dead:false,setupDone:false};
}
function migrate(s){
 if(!s||typeof s!=="object")return newGame();
 s.level=Math.max(1,num(s.level,1));s.xp=Math.max(0,num(s.xp,0));
 s.maxHp=Math.max(10,num(s.maxHp,10));s.hp=Math.max(0,Math.min(s.maxHp,num(s.hp,s.maxHp)));
 s.floor=Math.max(1,num(s.floor,1));s.x=num(s.x,0);s.y=num(s.y,0);s.gold=Math.max(0,num(s.gold,0));
 s.stats=s.stats||{};for(const k of ["int","str","cha","dex"])s.stats[k]=Math.max(1,num(s.stats[k],1));
 s.inventory=Array.isArray(s.inventory)?s.inventory:[];s.quests=Array.isArray(s.quests)?s.quests:[];s.rooms=s.rooms&&typeof s.rooms==="object"?s.rooms:{};
 s.logs=Array.isArray(s.logs)?s.logs:[];s.fingers=Array.isArray(s.fingers)&&s.fingers.length===10?s.fingers:Array(10).fill(true);
 s.equipment=s.equipment||{};if(!Array.isArray(s.equipment.rings)||s.equipment.rings.length!==10)s.equipment.rings=Array(10).fill(null);
 s.nickname=(typeof s.nickname==="string"?s.nickname.trim():"")||"Secret Hero";s.showCountry=!!s.showCountry;s.country=typeof s.country==="string"?s.country:"";
 if(!s.expeditionId)s.expeditionId=id();if(!s.expeditionTitle)s.expeditionTitle="THE CALL OF THE DEEP";
 if(typeof s.setupDone!=="boolean")s.setupDone=true;
 return s;
}
function load(){try{return migrate(JSON.parse(localStorage.getItem(SAVE_KEY)))}catch(e){return null}}
let S=load()||newGame(),tradeRoom=null;
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(S))}
function key(){return`${S.floor}:${S.x},${S.y}`}
function monster(){
 let p=monsters.filter(m=>m[1]<=Math.max(2,S.floor+1));
 if(Math.random()<.05)p=monsters;return pick(p);
}
function gen(){
 const safe=S.floor===1&&S.x===0&&S.y===0;
 const noFoe=safe||Math.random()<.32;
 const m=noFoe?null:monster();
 const hp=m?m[1]*4+r(5):0;
 return {foe:m?{name:m[0],power:m[1],kind:m[2],hp,maxHp:hp,defeated:false}:null,
 searched:false,questId:null,exits:{N:null,E:null,S:null,W:null},ladderDown:Math.random()<.13,
 ladderUp:S.floor>1&&Math.random()<.18,npc:null,trader:null,rest:null,loot:null};
}
function room(){const k=key();if(!S.rooms[k])S.rooms[k]=gen();return S.rooms[k]}
function opposite(d){return{N:"S",S:"N",E:"W",W:"E"}[d]}
function valid(){
 const rm=room(),out=[];
 for(const d of Object.keys(DIRS)){
  if(rm.exits[d]===false)continue;
  const [dx,dy]=DIRS[d],nk=`${S.floor}:${S.x+dx},${S.y+dy}`,nr=S.rooms[nk];
  if(nr&&nr.exits[opposite(d)]===false)continue;
  out.push(d);
 }
 return out;
}
/* v11: discovered map state is derived only from local room memory. */
function renderMap(){
 const floor=S.floor, radius=6, minX=S.x-radius,maxX=S.x+radius,minY=S.y-radius,maxY=S.y+radius;
 let html=`<h2>🗺️ Known Dungeon — Floor ${floor}</h2><div class="mapwrap"><div class="map" style="grid-template-columns:repeat(${maxX-minX+1},34px)">`;
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const k=`${floor}:${x},${y}`,rm=S.rooms[k],cls=["tile"],icon="";
  if(!rm){html+=`<div class="${cls.join(" ")}"></div>`;continue}
  cls.push("known");
  if(x===S.x&&y===S.y)cls.push("current");
  if(rm.ladderDown)cls.push("ladder");
  if(rm.npc)cls.push("npc");
  if(rm.trader)cls.push("trader");
  if(rm.rest)cls.push("rest");
  let i=x===S.x&&y===S.y?"●":"";
  if(rm.ladderDown)i+="↓";if(rm.ladderUp)i+="↑";if(rm.npc)i+="🔵";if(rm.trader)i+="💲";if(rm.rest)i+="💚";
  html+=`<div class="${cls.join(" ")}" title="${x===S.x&&y===S.y?"You are here":""}">${i}</div>`;
 }
 html+=`</div></div><div class="legend">Only discovered rooms are shown. No undiscovered room or border is revealed.</div>`;
 document.getElementById("map").innerHTML=html;
}
function log(t,c=""){S.logs.unshift(`<div class="${c}">${t}</div>`);save();render()}
function move(d){
 const rm=room();if(rm.foe&&!rm.foe.defeated)return log("⚔️ The foe blocks your path.","bad");
 if(!valid().includes(d))return log("That route is known to be blocked.");
 const [dx,dy]=DIRS[d];
 // Persist bidirectional knowledge: a known closed edge is closed from both sides.
 if(rm.exits[d]===null){
  const nk=`${S.floor}:${S.x+dx},${S.y+dy}`;
  if(S.rooms[nk]&&S.rooms[nk].exits[opposite(d)]===false)return log("That route is known to be blocked.");
 }
 S.x+=dx;S.y+=dy;room();save();render();
}
function clampHP(){S.hp=Math.max(0,Math.min(S.maxHp,num(S.hp,0)));const f=room();if(f.foe){f.foe.hp=Math.max(0,Math.min(f.foe.maxHp,num(f.foe.hp,0)))}}
function foeAccuracy(f){return Math.min(.9,Math.max(.55,.63+f.power*.018+S.floor*.006-S.stats.dex*.025))}
function foeDamage(f){let base=1+Math.floor(f.power/2)+r(Math.max(2,2+Math.ceil(f.power/2)));if(f.kind==="dragon")base+=2;return Math.max(1,base)}
function foeAttack(f,context="counter"){
 const hit=Math.random()<foeAccuracy(f);
 if(!hit){log(`🛡️ The ${f.name} misses its ${context}.`);return}
 let dmg=foeDamage(f);
 if(r(20)===20){dmg+=Math.max(1,Math.floor(dmg*.75));log(`💥 The ${f.name} finds a vulnerable spot!`,"bad")}
 S.hp-=dmg;clampHP();log(`The ${f.name} hits you for ${dmg}.`);
 if(S.hp<=0)die(`The ${f.name} defeats you.`);
}
function fight(){
 const f=room().foe;if(!f||f.defeated||S.dead)return;
 let dmg=Math.max(1,S.stats.str+r(6));f.hp-=dmg;f.hp=Math.max(0,f.hp);
 log(`You strike the ${f.name} for ${dmg}.`);
 if(f.hp<=0){f.defeated=true;f.hp=0;S.xp+=f.power*12;log(`🏆 You defeated the ${f.name}. The room is now safe to search.`,"good");level();save();render();return}
 foeAttack(f,"counterattack");if(S.dead)return;save();render();
}
function level(){
 while(S.xp>=S.level*100){S.level++;S.maxHp+=2;S.hp=S.maxHp;S.stats[pick(["str","dex","int","cha"])]++;
 log(`✨ LEVEL UP! You reached level ${S.level}. Max HP is now ${S.maxHp}; HP restored to ${S.hp}/${S.maxHp}.`,"gold")}
 clampHP();
}
function item(x){return{name:x[0],power:x[1]+r(3)-1,slot:x[2],trait:x[3],value:x[4]}}
function loot(){const special=Math.random()<.025+S.rareLuck*.015;if(special){S.rareLuck=0;return item(pick(rare))}S.rareLuck=Math.min(8,S.rareLuck+1);return item(pick(common))}
function lootFoe(f){const sp=rare.filter(x=>x[0].toLowerCase().includes(f.kind.toLowerCase())||f.kind==="skeletonKing"&&x[0].includes("Skeleton King")||f.kind==="dragon"&&x[0].includes("Dragon")||f.kind==="basilisk"&&x[0].includes("Basilisk")||f.kind==="medusa"&&x[0].includes("Medusa"));if(Math.random()<.18+S.rareLuck*.02){S.rareLuck=0;return item(pick(sp.length?sp:rare))}return loot()}
function search(){
 const rm=room();
 if(rm.foe&&!rm.foe.defeated)return log("You cannot search while fighting.");
 if(rm.searched)return log("This room has already been searched.");
 rm.searched=true;
 const q=r(100);

 // Active quest items can be found while exploring future rooms.
 const active=S.quests.filter(x=>!x.found&&!x.delivered);
 if(active.length && Math.random()<0.18){
   const quest=pick(active);
   quest.found=true;
   rm.questId=quest.id;
   log(`🔎 You find the quest item ${quest.itemName}. It is now ready to deliver.`,"good");
 } else if(q<=18){
   const i=loot();rm.loot=i;log(`🔎 You find ${i.name} in a cache.`,"good");
 } else if(q<=38){
   const i=loot();rm.loot=i;log(`🔎 You find ${i.name} in the room.`,"good");
 } else if(rm.foe&&rm.foe.defeated&&q<=68){
   const i=lootFoe(rm.foe);rm.loot=i;log(`☠️ You find ${i.name} on the corpse of the ${rm.foe.name}.`,"rare");
 } else if(q<=74){
   const questItems=[
    ["Moonstone Pick","a moonstone pick used to open an old royal seal"],
    ["Ashen Crown Shard","a shard of the Ashen Crown"],
    ["Deepforge Medallion","the lost medallion of the Deepforge clan"],
    ["King's Lost Signet","the missing signet of a forgotten dwarf king"],
    ["Emberheart Trinket","a small emberheart trinket that still glows"],
    ["Black Vein Crystal","a black crystal taken from the oldest mine"],
    ["Frostfire Charm","a charm said to balance frost and flame"]
   ];
   const qi=pick(questItems);
   const quest={id:id(),itemName:qi[0],description:qi[1],found:false,delivered:false,xp:100+S.floor*50,npcRoom:key()};
   S.quests.push(quest);
   rm.questId=quest.id;
   rm.npc={name:`${pick(names)} ${pick(beards)}`,title:pick(["Keeper of the Blue Hall","Quest-Bearer","Lorewarden","Warden of Lost Things"])};
   log(`🔵 You encounter ${rm.npc.name}, ${rm.npc.title}.`,"gold");
   log(`🔵 ${rm.npc.name} has a quest: find ${qi[0]} — ${qi[1]}. Return it for ${quest.xp} XP.`,"gold");
 } else if(q<=82){
   rm.trader=makeTrader();log(`💲 You encounter ${rm.trader.name}, ${rm.trader.title}.`,"gold");
 } else if(q<=89){
   rm.rest={uses:r(4)+1,heal:Math.max(2,Math.floor(S.maxHp*.35))};log("💚 You discover a source of rest.");
 } else log("🔎 You find nothing useful.");
 save();render();
}
function makeTrader(){let stock=[];for(let i=0;i<3;i++)stock.push(item(pick(Math.random()<.18?rare:common)));return{name:`${pick(names)} ${pick(beards)}`,title:pick(["the Merchant","the Trader","the Collector","the Gatherer","the Huntsman","Trading Master"]),stock}}
function renderTrade(){const rm=tradeRoom;if(!rm){document.getElementById("trade").innerHTML="";return}
 document.getElementById("trade").innerHTML=`<h2>💲 ${esc(rm.trader.name)} — ${esc(rm.trader.title)}</h2><p>Your gold: <b class="gold">${S.gold}</b></p>
 <h3>Buy</h3><div class="tradegrid">${rm.trader.stock.map((x,i)=>`<div class="item"><b>${esc(x.name)}</b><br>Power +${x.power}<br><span class="small">${esc(x.trait)}</span><br><b>${x.value}g</b><br><button onclick="buy(${i})" ${S.gold<x.value||S.inventory.length>=30?"disabled":""}>Buy</button></div>`).join("")}</div>
 <h3>Sell</h3><div class="tradegrid">${S.inventory.length?S.inventory.map((x,i)=>`<div class="item"><b>${esc(x.name)}</b><br>${Math.max(1,Math.floor(x.value*.5))}g<br><button onclick="sell(${i})">Sell permanently</button></div>`).join(""):"<span class='small'>You carry nothing to sell.</span>"}</div>
 <button onclick="tradeRoom=null;render()">Leave trade</button>`;
}
function deliverQuest(){
 const rm=room();
 if(!rm.npc)return;
 const quest=S.quests.find(x=>x.id===rm.questId&&!x.delivered);
 if(!quest)return log("🔵 There is no active quest to deliver here.");
 if(!quest.found)return log(`🔵 ${rm.npc.name} still needs the ${quest.itemName}.`);
 quest.delivered=true;
 S.xp+=quest.xp;
 log(`✅ You deliver ${quest.itemName} to ${rm.npc.name}. The quest item is removed from your quest section.`,"good");
 log(`🏆 ${rm.npc.name} rewards you with ${quest.xp} XP.`,"gold");
 rm.npc=null;rm.questId=null;
 level();save();render();
}
function trade(){const rm=room();if(!rm.trader)return;tradeRoom=rm;log(`💲 ${rm.trader.name} opens the trade counter. "Take your time, deepdelver."`,"gold");renderTrade()}
function buy(i){const rm=tradeRoom,x=rm?.trader?.stock[i];if(!x||S.gold<x.value||S.inventory.length>=30)return;S.gold-=x.value;S.inventory.push({...x});rm.trader.stock.splice(i,1);log(`💲 You bought ${x.name} for ${x.value} gold.`,"good");save();render()}
function sell(i){const x=S.inventory[i];if(!x)return;const v=Math.max(1,Math.floor(x.value*.5));if(!confirm(`Sell ${x.name} for ${v} gold? It cannot be bought back.`))return;S.inventory.splice(i,1);S.gold+=v;log(`💲 You sold ${x.name} for ${v} gold. It is gone permanently.`,"good");save();render()}
function rest(){const rm=room();if(!rm.rest||rm.rest.uses<=0)return log("There is nowhere safe to rest here.");rm.rest.uses--;S.hp=Math.min(S.maxHp,S.hp+rm.rest.heal);log(`💚 You rest and recover ${rm.rest.heal} HP.`,"good");if(rm.rest.uses===0){rm.rest=null;log("💚 The source is depleted.")}save();render()}
function ladder(d){const rm=room();if(d==="down"&&rm.ladderDown){S.floor++;S.x=0;S.y=0;room().ladderUp=true;log("🪜 You descend deeper.","gold")}
 else if(d==="up"&&rm.ladderUp){S.floor=Math.max(1,S.floor-1);S.x=0;S.y=0;room();log("🪜 You ascend to a remembered floor.","gold")}save();render()}
function useF(){const rm=room();if(rm.foe&&!rm.foe.defeated)return log("You cannot interact while fighting.");if(rm.trader)return trade();if(rm.npc)return log(`🔵 You speak with ${rm.npc.name}: "The deep keeps what it takes. Bring me what I seek."`,"gold");if(rm.ladderDown)return ladder("down");if(rm.ladderUp)return ladder("up");if(rm.rest)return rest();log("There is no special interaction here.")}
function flee(){
 const f=room().foe;if(!f||f.defeated||S.dead)return;
 const rr=r(20);
 if(rr===20){log(`🏃 Perfect escape! You slip away from the ${f.name} without consequence.`,"gold");moveAfterFlee();return}
 if(rr<=2){log(`⚠️ Catastrophic escape! The ${f.name} catches you before you can get clear.`,"bad");foeAttack(f,"vicious counterattack");if(S.dead)return;log("⚔️ You must finish the fight; another flee attempt is unavailable until your next combat turn.","bad");save();render();return}
 if(rr<=10){log(`🏃 You fail to escape cleanly. The ${f.name} strikes as you retreat.`,"bad");foeAttack(f,"counterattack");if(S.dead)return;save();render();return}
 log(`🏃 You break away from the ${f.name}, but the escape has a cost.`,"bad");
 const dmg=f.kind==="dragon"?3:f.kind==="basilisk"?2:1;S.hp-=dmg;clampHP();log(`You suffer ${dmg} damage while escaping.`,"bad");
 if(S.hp<=0){die("The escape proves fatal.");return}moveAfterFlee();
}
function moveAfterFlee(){
 // Flee leaves the hero in the same room but outside the immediate exchange.
 // The monster is intentionally retained; returning/acting again means the same monster.
 log("The monster remains in the chamber, waiting.","small");save();render();
}
function die(t){clampHP();S.dead=true;S.hp=0;log(`☠️ ${t} Your expedition ends here.`,"bad");save();render()}
function beginSetup(){S.nickname=(document.getElementById("nick")?.value||"").trim()||"Secret Hero";S.showCountry=!!document.getElementById("showCountry")?.checked;S.country=(document.getElementById("country")?.value||"").trim();S.setupDone=true;S.intro=false;log(`⛏️ ${esc(S.hero)} enters the dungeon under the name <b>${esc(S.nickname)}</b>.`,"gold");render()}
function render(){
 const rm=room();clampHP();
 document.getElementById("identity").innerHTML=`<b>${esc(S.hero)}</b> · <i>${esc(S.expeditionTitle)}</i> · <span class="small">${S.expeditionId}</span>`;
 document.getElementById("intro").innerHTML=!S.setupDone?`<h2>${esc(S.expeditionTitle)}</h2><p>${esc(S.opening)}</p><div class="field"><label>Nickname (optional): </label><input id="nick" maxlength="24" placeholder="Secret Hero"></div><div class="field"><label>Country (optional): </label><input id="country" maxlength="40" placeholder="e.g. Sweden"></div><div class="field"><label><input id="showCountry" type="checkbox"> Show my country in the Global Hall</label></div><button onclick="beginSetup()">Begin the descent</button>`:`<span class="small">The mountain closes behind you. The expedition continues.</span>`;
 document.getElementById("status").innerHTML=`❤️ ${S.hp}/${S.maxHp} HP · ⚒️ Lv ${S.level} · XP ${S.xp} · Floor ${S.floor} · 💰 ${S.gold} · 🎒 ${S.inventory.length}/30<br><span class="small">INT ${S.stats.int} · STR ${S.stats.str} · CHA ${S.stats.cha} · DEX ${S.stats.dex}</span>`;
 renderMap();
 let f=rm.foe&&!rm.foe.defeated?`<div>⚔️ <b>${esc(rm.foe.name)}</b> — ${Math.max(0,rm.foe.hp)}/${rm.foe.maxHp} HP</div>`:rm.foe?`<div>☠️ ${esc(rm.foe.name)} — 0/${rm.foe.maxHp} HP</div>`:"";
 document.getElementById("room").innerHTML=`<h2>Chamber</h2>${f}${rm.loot?`<div>🎁 <b>${esc(rm.loot.name)}</b> · +${rm.loot.power} · ${rm.loot.value}g</div>`:""}${!f&&rm.ladderDown?"<div>🟢 ↓ Ladder down</div>":""}${!f&&rm.ladderUp?"<div>🟢 ↑ Ladder up</div>":""}${rm.npc?`<div>🔵 ${esc(rm.npc.name)}, ${esc(rm.npc.title)}</div>`:""}${rm.trader?`<div>💲 ${esc(rm.trader.name)}, ${esc(rm.trader.title)}</div>`:""}${rm.rest?`<div>💚 Rest source: ${rm.rest.uses} uses</div>`:""}`;
 let h="";
 const liveFoe=!!(rm.foe&&!rm.foe.defeated&&S.hp>0&&!S.dead);
 if(liveFoe)h+=`<button onclick="fight()">⚔️ Fight</button><button onclick="flee()">🏃 Flee</button>`;
 else if(S.setupDone&&!S.dead){
  h+=`<button onclick="search()" ${rm.searched?"disabled":""}>🔎 Search</button><div class="compass"><span></span><button onclick="move('N')">↑ W</button><span></span><button onclick="move('W')">← A</button><button onclick="useF()">F</button><button onclick="move('E')">→ D</button><span></span><button onclick="move('S')">↓ S</button><span></span></div>`;
  if(rm.ladderDown)h+=`<button onclick="ladder('down')">↓ Descend</button>`;if(rm.ladderUp)h+=`<button onclick="ladder('up')">↑ Ascend</button>`;if(rm.trader)h+=`<button onclick="trade()">💲 Trade</button>`;if(rm.npc){const qst=S.quests.find(q=>q.id===rm.questId&&!q.delivered);h+=qst&&qst.found?`<button onclick="deliverQuest()">🔵 Deliver quest item</button>`:`<button onclick="useF()">🔵 Talk</button>`;}if(rm.rest)h+=`<button onclick="rest()">💚 Rest</button>`;
 }
 if(S.setupDone)h+=`<hr><button onclick="reset()">New Run</button>`;
 document.getElementById("actions").innerHTML=h;
 document.getElementById("equipment").innerHTML=`<h2>🎒 Equipment</h2><div class="equipgrid">${Object.entries(S.equipment).filter(([k])=>k!=="rings").map(([k,v])=>`<div class="item"><b>${esc(k)}</b><br>${v?esc(v.name):"<span class='small'>empty</span>"}</div>`).join("")}</div><div class="small">Rings: ${S.equipment.rings.map((x,i)=>x?`💍 ${esc(x.name)}`:`○${i+1}`).join(" · ")}</div>
 <div class="quest-panel"><h2>🔎 Quest Search</h2>${S.quests.filter(q=>!q.delivered).map(q=>`<div class="item">${q.found?"<span class='good'>✅</span>":"🔎"} <b>${esc(q.itemName)}</b><br><span class="small">${q.found?"Found — ready to deliver.":"Searching the dungeon..."}</span></div>`).join("")||"<span class='small'>No active quest searches.</span>"}</div>`;
 document.getElementById("log").innerHTML=S.logs.join("");
 document.getElementById("hall").innerHTML=`<h2>🏆 Global Hall</h2><div class="small">Your public tag: <b>${esc(S.nickname||"Secret Hero")}</b>${S.showCountry&&S.country?" · "+esc(S.country):""}</div>`;
 renderTrade();
}
function reset(){localStorage.removeItem(SAVE_KEY);S=newGame();tradeRoom=null;save();render()}
document.addEventListener("keydown",e=>{if(["INPUT","TEXTAREA"].includes(document.activeElement.tagName))return;const k=e.key.toLowerCase();if(k==="w")move("N");if(k==="a")move("W");if(k==="s")move("S");if(k==="d")move("E");if(k==="f")useF()});
render();