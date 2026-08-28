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

async function submitToGlobalHall(){
  const entry={
    name:S.name,
    nickname:S.nickname||"Secret Hero",
    xp:S.xp,
    level:S.level,
    floor:S.floor,
    items:countItems(),
    country:S.country||"",
    kills:S.totalKills||0,
    bestStreak:S.bestKillStreak||0,
    gold:S.gold||0,
    actions:S.actions||0
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
