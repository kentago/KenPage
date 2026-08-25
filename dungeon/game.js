const SAVE="infiniteDungeon_v3",HALL="infiniteDungeon_hall_v1";
const DWARF_FIRST=["Durin","Borin","Thorin","Dwalin","Gimli","Balin","Korin","Dorin","Fundin","Nali","Dori","Oin","Gloin","Kili","Fili","Thrain","Brokk","Eitri","Hakon","Rurik","Grim","Viggo","Bjarni","Sten","Torin","Ragnir"];
const DWARF_LAST=["Dagger","Stonebeard","Ironfoot","Oakshield","Deepdelver","Forgehand","Blackhammer","Goldvein","Emberaxe","Grimstone","Bronzebrow","Redbeard","Anvilborn","Runebrow","Stonewalker","Frostpick","Cinderfist","Mithrilhand","Cavernson","Alehammer"];
const ITEMS=[
{name:"Rusty Sword",stat:"str",bonus:1,tier:1},{name:"Hunter's Knife",stat:"dex",bonus:1,tier:1},{name:"Scholar's Charm",stat:"int",bonus:1,tier:1},{name:"Silver Brooch",stat:"cha",bonus:1,tier:1},
{name:"Iron Sword",stat:"str",bonus:2,tier:2},{name:"Shadow Knife",stat:"dex",bonus:2,tier:2},{name:"Sage Pendant",stat:"int",bonus:2,tier:2},{name:"Royal Signet",stat:"cha",bonus:2,tier:2},
{name:"Runeblade",stat:"str",bonus:3,tier:3},{name:"Whisperfang",stat:"dex",bonus:3,tier:3},{name:"Eye of Ages",stat:"int",bonus:3,tier:3},{name:"Crown of Echoes",stat:"cha",bonus:3,tier:3},
{name:"Sunken Crown",type:"quest",tier:4},{name:"Ashen Heart",type:"quest",tier:4}];
const FOES=[
{name:"Gravebound Warden",icon:"☠",kind:"Undead",lore:"A soldier who never learned that the war ended.",base:8},
{name:"Mire Stalker",icon:"◈",kind:"Beast",lore:"It follows warm blood through stone.",base:9},
{name:"Ash Goblin",icon:"♠",kind:"Goblin",lore:"The smallest servants of the furnace below.",base:10},
{name:"Vault Sentinel",icon:"◆",kind:"Construct",lore:"Ancient bronze given one instruction: keep the door shut.",base:12},
{name:"Hollow Knight",icon:"♜",kind:"Undead",lore:"Its armour remembers a name that its skull has forgotten.",base:14}];
const LORE=["The oldest stones were laid before the first kingdom had a name.","Someone carved thousands of tiny eyes into the walls. None face the same direction.","A faded inscription reads: THE DUNGEON DOES NOT GO DOWN. IT GOES IN.","The dust is undisturbed except for one set of footprints leading into solid rock.","A child's drawing shows a tower beneath the earth labelled HOME.","A rusted plaque names this place the Hollow March.","The walls are warm. Far below, something enormous is breathing.","An old expedition marker bears a date from a century you do not recognize.","You hear bells somewhere beneath the floor, though there are no bells in sight.","The same three words recur in ancient script: RETURN WITH THE CROWN."];
const NPCS=[{floor:3,name:"Archivist Elian",icon:"✦",text:"I seek the Sunken Crown. It was carried below by the last king. Bring it to me and I will open the sealed archive."},{floor:6,name:"The Ash Widow",icon:"☽",text:"The Ashen Heart was taken from my people. Find it below, and I will tell you what sleeps beneath the dungeon."}];
let S;
const randName=()=>DWARF_FIRST[Math.floor(Math.random()*DWARF_FIRST.length)]+" "+DWARF_LAST[Math.floor(Math.random()*DWARF_LAST.length)];
const hall=()=>{try{return JSON.parse(localStorage.getItem(HALL)||"[]")}catch{return[]}};
function registerHall(){if(!S||S.registered)return;S.registered=true;let h=hall();h.push({name:S.name,level:S.level,floor:S.floor,xp:S.totalXP||0,inventory:S.inventory.length});h.sort((a,b)=>b.xp-a.xp||b.level-a.level||b.floor-a.floor||b.inventory-a.inventory);localStorage.setItem(HALL,JSON.stringify(h.slice(0,10)))}
function save(){localStorage.setItem(SAVE,JSON.stringify(S))}
function newRun(confirmIt=true){if(confirmIt&&!confirm("Start a new run? Your current character will be lost."))return;S={name:randName(),seed:Math.floor(Math.random()*1e9),floor:1,x:4,y:4,level:1,xp:0,totalXP:0,hp:10,maxHp:10,stats:{str:1,dex:1,int:1,cha:1},inventory:[],rooms:{},explored:0,quest:null,dead:false,registered:false};discover();save();log(`A new expedition begins. ${S.name} enters the dungeon.`,"good");render()}
function load(){try{S=JSON.parse(localStorage.getItem(SAVE))}catch{}if(!S)newRun(false);if(!S.rooms)S.rooms={};if(S.totalXP==null)S.totalXP=S.xp||0;if(!S.name)S.name=randName();if(S.registered==null)S.registered=false}
function hash(a,b,c=0){let x=(a*374761393+b*668265263+c*1442695041)>>>0;x^=x>>>13;x=Math.imul(x,1274126177);return(x^(x>>>16))>>>0}
function rng(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let x=Math.imul(t^t>>>15,1|t);x^=x+Math.imul(x^x>>>7,61|x);return((x^x>>>14)>>>0)/4294967296}}
function roll(){return 1+Math.floor(Math.random()*20)}
function key(f,x,y){return `${f}:${x}:${y}`}
function template(f,x,y){const r=rng(hash(S.seed,f,x*31+y*97)),v=r();let type=v<.10?"treasure":v<.25?"foe":v<.34?"event":"normal",ladder=r()<Math.min(.22+f*.015,.45),dead=r()<.24;if(f===1&&x===4&&y===4){type="entrance";ladder=false;dead=false}let foe=type==="foe"?FOES[Math.floor(r()*Math.min(FOES.length,1+Math.floor((f+2)/3)))]:null;let lore=r()<.38?LORE[Math.floor(r()*LORE.length)]:null;let npc=NPCS.find(n=>n.floor===f&&((x+y+f)%3===0));return{type,ladder,dead,searchable:r()<.75||type==="treasure"||type==="event",foe,lore,npc}}
function room(){const k=key(S.floor,S.x,S.y);if(!S.rooms[k])S.rooms[k]={...template(S.floor,S.x,S.y),searched:false,defeated:false,loreRead:false,npcTalked:false};return S.rooms[k]}
function discover(){const k=key(S.floor,S.x,S.y);if(!S.rooms[k])S.rooms[k]={...template(S.floor,S.x,S.y),searched:false,defeated:false,loreRead:false,npcTalked:false};S.explored=Math.min(99,Math.floor(Object.keys(S.rooms).filter(k=>k.startsWith(S.floor+":")).length/18*100))}
function log(m,c=""){document.querySelector("#log").innerHTML=`<div class="entry ${c}">${m}</div>`+document.querySelector("#log").innerHTML}
function check(stat,dc){let d=roll(),total=d+S.stats[stat];return{d,total,crit:d===20,miss:d===1,success:d===20||total>=dc}}
function gainXP(n){S.xp+=n;S.totalXP=(S.totalXP||0)+n;while(S.xp>=S.level*35){S.xp-=S.level*35;S.level++;S.maxHp+=2;S.hp=S.maxHp;let st=["str","dex","int","cha"][(S.level-2)%4];S.stats[st]++;log(`LEVEL UP! ${st.toUpperCase()} increases to ${S.stats[st]}.`,"gold")}}
function loot(critical=false,quest=false){let max=Math.min(3,1+Math.floor((S.floor-1)/3)),p=quest?ITEMS.filter(i=>i.type==="quest"):ITEMS.filter(i=>i.type!=="quest"&&i.tier<=max);if(critical&&!quest)p=ITEMS.filter(i=>i.type!=="quest"&&i.tier<=Math.min(3,max+1));let i={...p[Math.floor(Math.random()*p.length)]};if(critical&&!quest){i.bonus++;i.name="★ "+i.name}S.inventory.push(i);log(`Loot: ${i.name}${i.bonus?` (+${i.bonus} ${i.stat.toUpperCase()})`:""}.`,"gold");if(S.inventory.length>6){let d=S.inventory.shift();log(`Inventory full. Discarded ${d.name}.`)}}
function nearDeath(cause="mishap",stat=null){
 const r=roll();
 const bands=[
  [2,0.05,1,1],
  [5,0.15,1,2],
  [8,0.30,1,3],
  [11,0.50,2,4],
  [14,0.70,3,5],
  [17,0.85,4,7],
  [19,0.95,5,8],
  [20,0.99,Math.max(1,Math.ceil(S.maxHp*.10)),Math.max(1,Math.ceil(S.maxHp*.30))]
 ];
 let b=bands.find(x=>r<=x[0])||bands[bands.length-1];
 let chance=b[1];
 // The relevant stat gives a small, meaningful edge without making death impossible.
 if(stat&&S.stats[stat]) chance=Math.min(.995,chance+(S.stats[stat]-1)*.025);
 const lucky=Math.random()<chance;
 if(!lucky){die(`The ${cause} proves fatal. Death roll ${r}/20.`);return}
 let hp=b[2]+Math.floor(Math.random()*(b[3]-b[2]+1));
 hp=Math.min(S.maxHp,Math.max(1,hp));
 S.hp=hp;
 let outcome=Math.random();
 if(outcome<.18&&S.inventory.length){
   let i=S.inventory.splice(Math.floor(Math.random()*S.inventory.length),1)[0];
   log(`FATE INTERVENES! You survive the ${cause} with ${hp} HP, but lose ${i.name}.`,"good");
 }else if(outcome<.28){
   let dx=Math.random()<.5?-1:1; S.x=Math.max(-7,Math.min(7,S.x+dx));
   discover(); log(`NARROW ESCAPE! You survive the ${cause} with ${hp} HP and stumble into another chamber.`,"gold");
 }else if(outcome<.36){
   gainXP(5+S.floor*2); log(`LEGENDARY ESCAPE! You survive the ${cause} with ${hp} HP. The ordeal teaches you something.`,"gold");
 }else{
   log(`You survive the ${cause} with ${hp} HP. Survival chance was ${(chance*100).toFixed(0)}%.`,"good");
 }
}
function damage(n){S.hp-=n;if(S.hp<=0)die("Your wounds are too severe.")}
function die(reason){S.dead=true;registerHall();save();render();log(`YOU DIED. ${reason}`,"bad")}
function criticalMiss(context){let r=Math.random();if(r<.45&&S.inventory.length){let i=S.inventory.splice(Math.floor(Math.random()*S.inventory.length),1)[0];log(`CRITICAL MISS! You lose ${i.name}.`,"bad")}else if(r<.9){let d=2+Math.floor(S.floor/2);damage(d);if(!S.dead)log(`CRITICAL MISS! You take ${d} damage.`,"bad")}else{log(`CRITICAL MISS! A lethal mishap occurs during ${context}.`,"bad");nearDeath("critical miss",S.stats.dex>=S.stats.int?"dex":"int")}}
function search(){let r=room();if(r.searched){log("This room has already been searched. There are no retries.");return}r.searched=true;let c=check("int",8+Math.floor(S.floor*.5));if(c.miss){criticalMiss("the search");save();render();return}let q=Math.random();if(r.foe&&!r.defeated)log("You cannot safely search while the foe is alive. Your search is spent.","bad");else if(q<.12){r.secret=true;gainXP(12+S.floor*2);log("SECRET PASSAGE! You uncover a concealed route.","gold")}else if(q<.3){let d=1+Math.floor(S.floor/2);if(c.success){log("You detect a hidden trap and disarm it.","good");gainXP(8+S.floor)}else{damage(d);if(!S.dead)log(`A hidden trap catches you. You take ${d} damage.`,"bad")}}else if(q<.52){loot(c.crit);gainXP(8+S.floor*2)}else if(q<.72){log("Lore: "+LORE[Math.floor(Math.random()*LORE.length)],"gold");gainXP(4+S.floor)}else log("Your search reveals nothing useful.");save();render()}
function fight(){let r=room();if(!r.foe||r.defeated){log("There is nothing here to fight.");return}let st=S.stats.str>=S.stats.dex?"str":"dex",c=check(st,r.foe.base+Math.floor(S.floor*.9));if(c.miss){criticalMiss("combat");save();render();return}if(c.success){r.defeated=true;let xp=10+S.floor*4+(c.crit?S.floor*10:0);gainXP(xp);if(Math.random()<.65||c.crit)loot(c.crit);log(`You defeat the ${r.foe.name}. ${c.crit?"CRITICAL SUCCESS — extraordinary spoils! ":""}+${xp} XP.`,"good")}else{let d=2+Math.floor(S.floor*.8)+Math.floor(Math.random()*3);damage(d);if(!S.dead)log(`Combat ${c.total} vs ${r.foe.base+Math.floor(S.floor*.9)} failed. You take ${d} damage.`,"bad")}save();render()}
function talk(){let r=room();if(!r.npc||r.npcTalked){log("There is nobody here to speak with.");return}r.npcTalked=true;if(!S.quest){S.quest={item:r.npc.floor===3?"Sunken Crown":"Ashen Heart",npc:r.npc.name};log(`${r.npc.name}: "${r.npc.text}"`,"gold");log(`QUEST: Find the ${S.quest.item}.`,"good")}save();render()}
function deliver(){let r=room();if(!S.quest||!r.npc||r.npc.name!==S.quest.npc){log("Nothing to deliver here.");return}let i=S.inventory.findIndex(x=>x.name===S.quest.item);if(i<0){log(`You still need the ${S.quest.item}.`);return}S.inventory.splice(i,1);gainXP(35+S.floor*5);log(`${r.npc.name} accepts the ${S.quest.item}. Ancient lore is revealed: the dungeon was built to imprison something that learned how to dream.`,"gold");S.quest=null;save();render()}
function move(dx,dy){if(S.dead)return;let nx=S.x+dx,ny=S.y+dy;if(Math.abs(nx)>7||Math.abs(ny)>7){log("The passage is blocked.");return}S.x=nx;S.y=ny;discover();let r=room();if(r.lore&&!r.loreRead){r.loreRead=true;log("Lore: "+r.lore,"gold")}save();render()}
function descend(){let r=room();if(!r.ladder){log("There is no way down here.");return}let rush=Math.max(0,.55-S.explored/100);S.floor++;S.x=4;S.y=4;S.hp=Math.min(S.maxHp,S.hp+2);log(`You descend to Floor ${S.floor}.`,"gold");if(Math.random()<Math.min(.75,rush)){let d=Math.max(1,Math.floor(S.floor/2));damage(d);if(!S.dead)log("You descended too quickly. A guardian ambushes you.","bad")}discover();save();render()}
function heal(){S.hp=Math.min(S.maxHp,S.hp+Math.max(2,Math.floor(S.maxHp*.3)));log("You recover some strength.","good");save();render()}
function actions(){let r=room(),dis=S.dead?"disabled":"";let h=`<div class="actionGrid"><button onclick="move(0,-1)" ${dis}>↑ North</button><button onclick="move(-1,0)" ${dis}>← West</button><button onclick="move(1,0)" ${dis}>East →</button><button onclick="move(0,1)" ${dis}>↓ South</button>`;if(r.foe&&!r.defeated)h+=`<button onclick="fight()" ${dis}>⚔ Fight</button>`;if(r.searchable&&!r.searched)h+=`<button onclick="search()" ${dis}>✦ Search</button>`;if(r.npc&&!r.npcTalked)h+=`<button onclick="talk()" ${dis}>☏ Talk</button>`;if(r.npc&&r.npc.talked&&S.quest&&S.quest.npc===r.npc.name)h+=`<button onclick="deliver()" ${dis}>◆ Deliver Quest Item</button>`;if(r.ladder)h+=`<button onclick="descend()" ${dis}>⇩ Descend</button>`;if(S.hp<S.maxHp)h+=`<button onclick="heal()" ${dis}>♥ Rest</button>`;return h+"</div>"+(S.dead?'<p class="hint">Your expedition has ended. Start a new run.</p>':"")}
function renderHall(){let e=document.querySelector("#hall"),h=hall();e.innerHTML=h.length?h.map((x,i)=>`<div class="hallRow"><span>#${i+1}</span><b>${x.name}</b><span>Lv ${x.level}</span><span>F${x.floor}</span><span>${x.xp} XP</span><span>${x.inventory} items</span></div>`).join(""):'<div class="empty">No fallen heroes yet.</div>'}
function renderMap(){let h="";for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){let ax=S.x+x,ay=S.y+y,k=key(S.floor,ax,ay),v=S.rooms[k],t=template(S.floor,ax,ay),c=v?"cell visited":"cell unknown";if(ax===S.x&&ay===S.y)c+=" current";if(v&&v.ladder)c+=" ladder";if(v&&v.defeated)c+=" dead";h+=`<div class="${c}">${ax===S.x&&ay===S.y?"◆":v?(v.ladder?"⇩":"·"):""}</div>`}document.querySelector("#map").innerHTML=h}
function render(){let r=room();document.querySelector("#heroName").textContent=S.name;document.querySelector("#floor").textContent=S.floor;document.querySelector("#level").textContent=S.level;document.querySelector("#xp").textContent=S.xp;document.querySelector("#hp").textContent=`${Math.max(0,S.hp)} / ${S.maxHp}`;for(let k of["str","dex","int","cha"])document.querySelector("#"+k).textContent=S.stats[k];document.querySelector("#hpBar").style.width=`${Math.max(0,S.hp)/S.maxHp*100}%`;document.querySelector("#seed").textContent=S.seed;document.querySelector("#exploration").textContent=S.explored+"%";document.querySelector("#danger").textContent=(1+S.floor*.35).toFixed(1)+"×";document.querySelector("#roomTitle").textContent=S.dead?"Your Expedition Has Ended":r.foe&&!r.defeated?r.foe.name:(r.type==="entrance"?"The Entrance":`Floor ${S.floor} · Chamber`);document.querySelector("#roomDesc").textContent=S.dead?"Death is permanent.":r.foe&&!r.defeated?r.foe.lore:r.lore||"Ancient stone, dust and distant echoes surround you.";let f=document.querySelector("#foeCard");if(r.foe&&!r.defeated&&!S.dead){f.innerHTML=`<div class="foeArt">${r.foe.icon}</div><div><b>${r.foe.name}</b><small>${r.foe.kind} · Threat ${r.foe.base+Math.floor(S.floor*.9)}</small><p>${r.foe.lore}</p></div>`;f.style.display="flex"}else f.style.display="none";document.querySelector("#inventory").innerHTML=S.inventory.length?S.inventory.map(i=>`<div class="item"><b>${i.name}</b><small>${i.type==="quest"?"Quest item":`+${i.bonus} ${i.stat.toUpperCase()}`}</small></div>`).join(""):'<div class="empty">Empty</div>';document.querySelector("#quest").innerHTML=S.quest?`<b>${S.quest.item}</b><small>Return to ${S.quest.npc}</small>`:"No active quest";document.querySelector("#actions").innerHTML=actions();renderMap();renderHall()}
document.querySelector("#newRunBtn").onclick=()=>newRun(true);load();discover();render();
