// --- HALL OF FAME: Global D1 API + localStorage fallback ---
let globalHall=[]; // Cached global leaderboard from D1
let currentSeason=null;
let allSeasons=[];
let viewingSeason=null; // null = current season

function countItems(){
  let count=S.inventory.length;
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{if(S.equipment[k])count++});
  count+=S.equipment.rings.filter(x=>x).length;
  return count;
}

// Convert an integer (1-3999) to a Roman numeral.
function toRoman(num){
  const map=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let r="";
  for(let [v,s] of map){ while(num>=v){ r+=s; num-=v; } }
  return r;
}

// Strip an existing trailing Roman numeral from a name (so we don't double-stack).
function stripRoman(name){
  return name.replace(/\s+[IVXLCDM]+$/,"");
}

// Given a base hero name, count how many entries in the current Hall of Fame
// already share that base name, and append the next Roman numeral if needed.
function disambiguateName(baseName){
  let stripped=stripRoman(baseName);
  let list=globalHall||[];
  let count=0;
  for(let e of list){
    if(e.name&&stripRoman(e.name)===stripped) count++;
  }
  // First hero with this name keeps it plain; the next is II, then III, etc.
  if(count===0) return stripped;
  return `${stripped} ${toRoman(count+1)}`;
}

// Apply the Roman-numeral suffix to the CURRENT hero's name at run start,
// based on how many heroes with the same base name are on the leaderboard.
// Only does this for a fresh, untouched run (no progress yet) so we never
// rename a hero mid-expedition.
function applyHeroNumeral(){
  if(!S) return;
  let untouched=(S.xp||0)===0&&(S.floor||1)===1&&(S.totalKills||0)===0;
  if(!untouched) return;
  let newName=disambiguateName(S.name);
  if(newName!==S.name){
    S.name=newName;
    save();
    render();
  }
}
window.applyHeroNumeral=applyHeroNumeral;

// Find the hero's single best equipped item (highest total stat sum) — used as
// a flavour tiebreaker so two heroes with the same name+numeral stay distinct.
function bestItemName(){
  let equipped=[];
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{
    if(S.equipment[k]) equipped.push(S.equipment[k]);
  });
  S.equipment.rings.forEach(x=>{if(x)equipped.push(x);});
  if(equipped.length===0) return null;
  let best=equipped.reduce((a,b)=>{
    let sa=Object.values(a.stats||{}).reduce((x,y)=>x+y,0);
    let sb=Object.values(b.stats||{}).reduce((x,y)=>x+y,0);
    return sb>sa?b:a;
  });
  return best.name;
}

// Build the final submission name. If another leaderboard entry already shares
// this exact name (numeral collision / race), append "wielding <best item>".
function finalSubmitName(){
  let name=S.name;
  let list=globalHall||[];
  let clash=list.some(e=>e.name===name);
  if(clash){
    let item=bestItemName();
    if(item) name=`${name} wielding ${item}`;
  }
  return name;
}

async function submitToGlobalHall(){
  const entry={
    name:finalSubmitName(),
    nickname:S.nickname||"Secret Hero",
    xp:S.xp,
    level:S.level,
    floor:S.floor,
    items:countItems(),
    country:S.country||"",
    kills:S.totalKills||0,
    bestStreak:S.bestKillStreak||0,
    gold:S.gold||0,
    actions:S.actions||0,
    date:new Date().toISOString() // client-side registration timestamp (fallback + offline)
  };

  // Always save to localStorage as fallback
  let local=JSON.parse(localStorage.getItem("infiniteDungeonHall")||"[]");
  local.push(entry);
  local.sort((a,b)=>b.xp-a.xp||b.level-a.level||b.floor-a.floor||b.items-a.items);
  local=local.slice(0,10);
  localStorage.setItem("infiniteDungeonHall",JSON.stringify(local));

  // Immediately show in Hall of Fame (before API responds)
  globalHall=local;
  renderHall();

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

async function fetchGlobalHall(seasonId){
  try{
    let url=`${API_BASE}/leaderboard`;
    if(seasonId) url+=`?season=${seasonId}`;
    const res=await fetch(url);
    if(res.ok){
      const data=await res.json();
      if(data.ok&&data.leaderboard){
        globalHall=data.leaderboard;
        if(data.season) viewingSeason=data.season;
        renderHall();
        return;
      }
    }
  }catch(err){
    console.warn("⚠️ Could not fetch Global Hall of Fame, using local fallback.",err);
  }
  globalHall=JSON.parse(localStorage.getItem("infiniteDungeonHall")||"[]");
  renderHall();
}

async function fetchSeasons(){
  try{
    const res=await fetch(`${API_BASE}/seasons`);
    if(res.ok){
      const data=await res.json();
      if(data.ok) allSeasons=data.seasons||[];
    }
    const res2=await fetch(`${API_BASE}/season`);
    if(res2.ok){
      const data2=await res2.json();
      if(data2.ok) currentSeason=data2.season;
    }
  }catch(err){
    console.warn("⚠️ Could not fetch seasons.",err);
  }
}

function viewSeason(seasonId){
  fetchGlobalHall(seasonId||null);
}
window.viewSeason=viewSeason;

// Format a Hall-of-Fame entry's registration time. Prefers the server's
// created_at (D1), falls back to the client-submitted `date`. Returns "" if none.
// Shown in the viewer's local timezone as a readable date + time.
function hallTimestamp(x){
  let raw=x.created_at||x.date;
  if(!raw) return "";
  // SQLite CURRENT_TIMESTAMP is "YYYY-MM-DD HH:MM:SS" in UTC with no zone marker.
  // Normalise to ISO ("T" + "Z") so it parses consistently across browsers.
  if(typeof raw==="string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)){
    raw=raw.replace(" ","T")+"Z";
  }
  let d=new Date(raw);
  if(isNaN(d.getTime())) return "";
  // e.g. "Aug 30, 2026 · 21:34" — compact, locale-aware, in the viewer's timezone
  let date=d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
  let time=d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
  return `${date} · ${time}`;
}

function renderHall(){
  const list=globalHall.length?globalHall:JSON.parse(localStorage.getItem("infiniteDungeonHall")||"[]");
  let seasonLabel=viewingSeason?`${viewingSeason.name}${viewingSeason.ended_at?" (ended)":""}`:(currentSeason?currentSeason.name:"Season");
  let seasonNav="";
  if(allSeasons.length>0){
    seasonNav=`<div class="season-nav"><select id="seasonSelect" onchange="viewSeason(this.value)">
      ${allSeasons.map(s=>`<option value="${s.id}"${(viewingSeason&&viewingSeason.id===s.id)||(!viewingSeason&&!s.ended_at)?" selected":""}>${s.name}${s.ended_at?"":" ⚡ current"}</option>`).join("")}
    </select></div>`;
  }
  hall.innerHTML=`<div class="season-header">🏆 ${seasonLabel}</div>${seasonNav}`+
    (list.slice(0,10).map((x,i)=>`<div class="card hall-entry">
    <span class="hall-rank">#${i+1}</span>
    ${countryFlag(x.country)} <b>${x.nickname||"Secret Hero"}</b> — ${x.name}
    <div class="small">XP ${x.xp} · Level ${x.level} · Floor ${x.floor} · Items ${x.items}</div>
    <div class="small">⚔️ ${x.kills||0} kills · 🔥 ${x.bestStreak||0} streak · 💰 ${x.gold||0} gold</div>
    ${hallTimestamp(x)?`<div class="small hall-date">🕐 ${hallTimestamp(x)}</div>`:""}
  </div>`).join("")||"<div class=small>No completed expeditions yet.</div>");
}

// Convert country code to flag emoji
function countryFlag(code){
  if(!code||code.length!==2)return"🌍";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6+c.charCodeAt(0)-65));
}

// Map common timezones to country codes (no external API needed)
function tzToCountry(tz){
  const map={"Europe/Stockholm":"SE","Europe/London":"GB","Europe/Berlin":"DE","Europe/Paris":"FR","Europe/Oslo":"NO","Europe/Helsinki":"FI","Europe/Copenhagen":"DK","Europe/Amsterdam":"NL","Europe/Brussels":"BE","Europe/Zurich":"CH","Europe/Vienna":"AT","Europe/Rome":"IT","Europe/Madrid":"ES","Europe/Lisbon":"PT","Europe/Warsaw":"PL","Europe/Prague":"CZ","Europe/Budapest":"HU","Europe/Bucharest":"RO","Europe/Athens":"GR","Europe/Dublin":"IE","America/New_York":"US","America/Chicago":"US","America/Denver":"US","America/Los_Angeles":"US","America/Toronto":"CA","America/Vancouver":"CA","America/Sao_Paulo":"BR","America/Mexico_City":"MX","Asia/Tokyo":"JP","Asia/Seoul":"KR","Asia/Shanghai":"CN","Asia/Kolkata":"IN","Asia/Singapore":"SG","Australia/Sydney":"AU","Australia/Melbourne":"AU","Pacific/Auckland":"NZ"};
  return map[tz]||"";
}
