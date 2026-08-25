const SAVE="infiniteDungeon_v1";

const ITEMS=[
 {name:"Rusty Sword",type:"weapon",stat:"str",bonus:1,tier:1},
 {name:"Hunter's Knife",type:"weapon",stat:"dex",bonus:1,tier:1},
 {name:"Scholar's Charm",type:"accessory",stat:"int",bonus:1,tier:1},
 {name:"Silver Brooch",type:"accessory",stat:"cha",bonus:1,tier:1},
 {name:"Iron Sword",type:"weapon",stat:"str",bonus:2,tier:2},
 {name:"Shadow Knife",type:"weapon",stat:"dex",bonus:2,tier:2},
 {name:"Sage Pendant",type:"accessory",stat:"int",bonus:2,tier:2},
 {name:"Royal Signet",type:"accessory",stat:"cha",bonus:2,tier:2},
 {name:"Runeblade",type:"weapon",stat:"str",bonus:3,tier:3},
 {name:"Whisperfang",type:"weapon",stat:"dex",bonus:3,tier:3},
 {name:"Eye of Ages",type:"accessory",stat:"int",bonus:3,tier:3},
 {name:"Crown of Echoes",type:"accessory",stat:"cha",bonus:3,tier:3}
];

let S;

function rng(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let x=Math.imul(t^t>>>15,1|t);x^=x+Math.imul(x^x>>>7,61|x);return((x^x>>>14)>>>0)/4294967296}}
function hash(a,b,c=0){let x=(a*374761393+b*668265263+c*1442695041)>>>0;x^=x>>>13;x=Math.imul(x,1274126177);return (x^(x>>>16))>>>0}
function roll(){return 1+Math.floor(Math.random()*20)}
function save(){localStorage.setItem(SAVE,JSON.stringify(S))}
function load(){try{S=JSON.parse(localStorage.getItem(SAVE))}catch{} if(!S)newRun(false)}
function newRun(confirmIt=true){if(confirmIt&&!confirm("Start a new run? Your current character will be lost."))return;S={seed:Math.floor(Math.random()*1e9),floor:1,x:4,y:4,level:1,xp:0,hp:10,maxHp:10,stats:{str:1,dex:1,int:1,cha:1},inventory:[],visited:{},explored:0,rooms:0,dead:false};log("A new expedition begins.","good");save();render()}
function key(f,x,y){return `${f}:${x}:${y}`}
function roomData(f,x,y){
 const r=rng(hash(S.seed,f,x*31+y*97)); const v=r();
 let type=v<.08?"treasure":v<.16?"enemy":v<.22?"event":"normal";
 let ladder=r()<Math.min(.22+f*.015,.45);
 let dead=r()<.24;
 if((x===4&&y===4&&f===1)) {type="entrance";ladder=false;dead=false}
 return {type,ladder,dead,seed:hash(S.seed,f,x,y)}
}
function current(){return roomData(S.floor,S.x,S.y)}
function adjacent(){return [[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>({x:S.x+dx,y:S.y+dy}))}
function discover(){
 const k=key(S.floor,S.x,S.y); if(!S.visited[k]){S.visited[k]=true;S.rooms++;S.explored=Math.min(99,Math.floor(S.rooms/(S.rooms+Math.max(3,Math.floor(S.rooms/3)))*100)); trigger(current())}
}
function trigger(r){
 if(r.type==="entrance")log("The entrance. The dungeon waits below.")
 else if(r.type==="treasure")log("You found a forgotten cache. Search it.","gold")
 else if(r.type==="enemy")log("Something moves in the darkness. Prepare yourself.","bad")
 else if(r.type==="event")log("You discover an unusual chamber. Something may be hidden here.","good")
 else if(r.dead)log("A dead end. Sometimes the safest road is the wrong road.")
 else log("The passage continues.")
}
function move(dx,dy){
 if(S.dead)return;
 const nx=S.x+dx,ny=S.y+dy;
 if(Math.abs(nx)>7||Math.abs(ny)>7){log("The passage is blocked by ancient stone.");return}
 S.x=nx;S.y=ny;discover();save();render()
}
function d20Check(stat,dc){
 const d=roll(), total=d+S.stats[stat];
 if(d===20)return {crit:true,success:true,d,total};
 return {crit:false,success:total>=dc,d,total}
}
function search(){
 const r=current();
 if(r.type==="treasure"){loot(true);r.type="normal";log("You search the cache.","good")}
 else if(r.type==="event"){const stat=["int","dex","cha"][Math.floor(Math.random()*3)];const dc=10+S.floor;const c=d20Check(stat,dc);if(c.success){loot(c.crit);gainXP(8+S.floor*2);log(`${stat.toUpperCase()} check ${c.total} vs ${dc}: ${c.crit?"CRITICAL SUCCESS!":"success."}`,"gold")}else{damage(1+Math.floor(S.floor/3));log(`${stat.toUpperCase()} check failed. The chamber bites back.`,"bad")}}
 else log("There is nothing obvious to search here.")
 save();render()
}
function fight(){
 const dc=8+Math.floor(S.floor*1.8)+Math.floor(Math.random()*4);
 const stat=S.stats.str>=S.stats.dex?"str":"dex"; const c=d20Check(stat,dc);
 if(c.success){
   const xp=10+S.floor*4+(c.crit?S.floor*10:0);gainXP(xp);
   if(Math.random()<.55||c.crit)loot(c.crit);
   log(`You overcome the foe. ${c.crit?"CRITICAL SUCCESS — extraordinary spoils! ":""}+${xp} XP.`,"good");
 }else{
   const dmg=2+Math.floor(S.floor*.8)+Math.floor(Math.random()*3);
   damage(dmg);log(`Combat check ${c.total} vs ${dc}: failed. You take ${dmg} damage.`,"bad");
 }
 current().type="normal";save();render()
}
function loot(critical=false){
 const maxTier=Math.min(3,1+Math.floor((S.floor-1)/3));
 let pool=ITEMS.filter(i=>i.tier<=maxTier);
 if(critical&&maxTier<3)pool=ITEMS.filter(i=>i.tier<=maxTier+1);
 const item={...pool[Math.floor(Math.random()*pool.length)]};
 if(critical){item.bonus++;item.name="★ "+item.name}
 S.inventory.push(item);
 log(`Loot: ${item.name} (+${item.bonus} ${item.stat.toUpperCase()}).`,"gold");
 if(S.inventory.length>6){const dropped=S.inventory.shift();log(`Inventory full. Discarded ${dropped.name}.`)}
}
function gainXP(n){S.xp+=n;while(S.xp>=S.level*35){S.xp-=S.level*35;S.level++;S.maxHp+=2;S.hp=S.maxHp;const stat=["str","dex","int","cha"][(S.level-2)%4];S.stats[stat]++;log(`LEVEL UP! ${stat.toUpperCase()} increases to ${S.stats[stat]}.`,"gold")}}
function damage(n){S.hp-=n;if(S.hp<=0)die()}
function heal(){S.hp=Math.min(S.maxHp,S.hp+Math.max(2,Math.floor(S.maxHp*.3)));log("You recover some strength.","good");save();render()}
function descend(){
 const r=current();if(!r.ladder){log("There is no way down here.");return}
 const threshold=1+S.floor*.07; const exploration=S.explored/100;
 const rush=Math.max(0,threshold-exploration);
 S.floor++;S.x=4;S.y=4;S.hp=Math.min(S.maxHp,S.hp+2);
 log(`You descend to Floor ${S.floor}. The air grows colder.`,"gold");
 if(Math.random()<Math.min(.75,rush*.9)) {const dmg=Math.max(1,Math.floor(S.floor/2));damage(dmg);if(!S.dead)log("You descended too quickly and a guardian ambushes you.","bad")}
 discover();save();render()
}
function die(){S.dead=true;save();render();log("YOU DIED. This character's journey is over.","bad")}
function actButtons(){
 const r=current(), disabled=S.dead?"disabled":"";
 let html=`<div class="actionGrid">
 <button onclick="move(0,-1)" ${disabled}>↑ North</button>
 <button onclick="move(-1,0)" ${disabled}>← West</button>
 <button onclick="move(1,0)" ${disabled}>East →</button>
 <button onclick="move(0,1)" ${disabled}>↓ South</button>`;
 if(r.type==="enemy")html+=`<button onclick="fight()" ${disabled}>⚔ Fight</button>`;
 if(r.type==="treasure"||r.type==="event")html+=`<button onclick="search()" ${disabled}>✦ Search</button>`;
 if(r.ladder)html+=`<button onclick="descend()" ${disabled}>⇩ Descend</button>`;
 if(S.hp<S.maxHp)html+=`<button onclick="heal()" ${disabled}>♥ Rest</button>`;
 html+=`</div>`;
 if(S.dead)html+=`<p class="hint">Your run has ended. Start a new run to enter the dungeon again.</p>`;
 return html
}
function render(){
 if(!S)return;
 const r=current();document.querySelector("#floor").textContent=S.floor;document.querySelector("#level").textContent=S.level;
 document.querySelector("#xp").textContent=S.xp;document.querySelector("#hp").textContent=`${Math.max(0,S.hp)} / ${S.maxHp}`;
 ["str","dex","int","cha"].forEach(k=>document.querySelector("#"+k).textContent=S.stats[k]);
 document.querySelector("#hpBar").style.width=`${Math.max(0,S.hp)/S.maxHp*100}%`;
 document.querySelector("#seed").textContent=S.seed;document.querySelector("#exploration").textContent=S.explored+"%";
 document.querySelector("#danger").textContent=(1+S.floor*.35).toFixed(1)+"×";
 document.querySelector("#roomTitle").textContent=S.dead?"Your Expedition Has Ended":r.type==="entrance"?"The Entrance":`Floor ${S.floor} · ${r.type==="enemy"?"Threat":"Chamber"}`;
 document.querySelector("#roomDesc").textContent=S.dead?"Death is permanent. The dungeon remains.":r.type==="enemy"?"A hostile presence blocks the passage.":r.ladder?"You feel a draft from below. A ladder descends into darkness.":"Ancient stone, dust and distant echoes surround you.";
 document.querySelector("#inventory").innerHTML=S.inventory.length?S.inventory.map(i=>`<div class="item"><b>${i.name}</b><small>+${i.bonus} ${i.stat.toUpperCase()}</small></div>`).join(""):`<div class="empty">Empty</div>`;
 document.querySelector("#actions").innerHTML=actButtons();renderMap()
}
function renderMap(){
 const map=document.querySelector("#map");let html="";
 for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){
   const ax=S.x+x,ay=S.y+y,k=key(S.floor,ax,ay),v=S.visited[k],r=roomData(S.floor,ax,ay);
   let cls=v?"cell visited":"cell unknown";if(ax===S.x&&ay===S.y)cls+=" current";
   if(v&&r.ladder)cls+=" ladder";if(v&&r.dead)cls+=" dead";
   html+=`<div class="${cls}">${ax===S.x&&ay===S.y?"◆":v?(r.ladder?"⇩":"·"):""}</div>`;
 }
 map.innerHTML=html
}
function log(msg,kind=""){const el=document.querySelector("#log");el.innerHTML=`<div class="entry ${kind}">${msg}</div>`+el.innerHTML}
document.querySelector("#newRunBtn").onclick=()=>newRun(true);
load();discover();render();
