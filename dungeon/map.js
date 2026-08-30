// --- MAP RENDERING: Grid of rectangular boxes ---
function drawMap(){
  // Always center the viewport on the player's current room for the best
  // all-around vision. Fixed odd-sized window so the player sits dead center.
  let viewSize=11;                 // 11×11 window (must be odd)
  let half=Math.floor(viewSize/2); // 5 cells in every direction
  let minX=S.x-half, maxX=S.x+half;
  let minY=S.y-half, maxY=S.y+half;

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

        // Collect ALL features present so secondary ones show as corner badges.
        let feats=[];
        if(rm.ladder){
          let toll=(rm.ladder.toll&&!rm.ladder.tollPaid);
          if(rm.ladder.emergency) feats.push("🕳️↓");
          else feats.push(rm.ladder.dir==="down"?(toll?"🚧↓":"🪜↓"):(toll?"🚧↑":"🪜↑"));
        }
        if(rm.npc&&!rm.npc.completed) feats.push("🔵");
        if(rm.trader) feats.push("💲");
        if(rm.doctor) feats.push("⚕️");
        if(rm.rest&&!rm.rest.depleted) feats.push(rm.rest.type==="luck"?"🍀":"💚");
        if(rm.portal) feats.push("🌀");

        if(isPlayer){
          symbol="◎";
          cellClass+=" player";
        } else if(rm.enemy&&rm.enemy.hp>0){
          symbol=rm.enemy.isBoss?"👑":"⚔";
          cellClass+=rm.enemy.isBoss?" boss":" enemy";
        } else if(rm.npc&&!rm.npc.completed){
          symbol="🔵";
          cellClass+=" npc";
        } else if(rm.trader){
          symbol="💲";
          cellClass+=" trader";
        } else if(rm.doctor){
          symbol="⚕️";
          cellClass+=" doctor";
        } else if(rm.ladder&&rm.ladder.dir==="down"){
          let toll=(rm.ladder.toll&&!rm.ladder.tollPaid);
          if(rm.ladder.emergency){
            symbol="🕳️↓";
            cellClass+=rm.ladder.used?" ladder-used":" ladder-emergency";
          } else {
            symbol=toll?"🚧↓":"🪜↓";
            cellClass+=rm.ladder.used?" ladder-used":toll?" ladder-toll":" ladder-down";
          }
        } else if(rm.ladder&&rm.ladder.dir==="up"){
          let toll=(rm.ladder.toll&&!rm.ladder.tollPaid);
          symbol=toll?"🚧↑":"🪜↑";
          cellClass+=rm.ladder.used?" ladder-used":toll?" ladder-toll":" ladder-up";
        } else if(rm.portal){
          symbol="🌀";
          cellClass+=" secret";
        } else if(rm.rest&&!rm.rest.depleted){
          symbol=rm.rest.type==="luck"?"🍀":"💚";
          cellClass+=" rest-source";
        } else {
          symbol="·";
          cellClass+=" visited";
        }

        // Corner badges = features not already shown as the primary symbol.
        // If standing on the cell (player ◎), every feature becomes a badge.
        let extra=isPlayer?feats:feats.filter(f=>f!==symbol);
        let badges=extra.length?`<span class="map-badges">${extra.slice(0,3).join("")}</span>`:"";

        let borders="";
        if(rm){
          if(rm.blocked.N) borders+=" blocked-n";
          if(rm.blocked.S) borders+=" blocked-s";
          if(rm.blocked.E) borders+=" blocked-e";
          if(rm.blocked.W) borders+=" blocked-w";
        }

        html+=`<div class="${cellClass}${borders}"><span class="map-symbol">${symbol}</span>${badges}</div>`;
      }
    }
  }
  html+=`</div>`;
  return html;
}

function checkFloorEscape(){
  // Emergency portal ONLY spawns if:
  // 1. No ladder down exists ANYWHERE on this floor
  // 2. No unexplored exits remain (player is completely stuck)
  // 3. ALL rooms on this floor have been searched (hidden ladder could still appear)
  let hasLadderDown=false;
  let hasUnexploredExit=false;
  let hasUnsearchedRoom=false;

  for(let k of Object.keys(S.rooms)){
    let parts=k.split(":");
    if(parseInt(parts[0])!==S.floor)continue;
    let rm=S.rooms[k];

    if(rm.ladder&&rm.ladder.dir==="down") hasLadderDown=true;
    if(!rm.searched) hasUnsearchedRoom=true;

    let rx=parseInt(parts[1]),ry=parseInt(parts[2]);
    for(let dir of["N","S","E","W"]){
      if(rm.blocked&&rm.blocked[dir])continue;
      let nx=rx+DIR_DX[dir],ny=ry+DIR_DY[dir];
      let nk=`${S.floor}:${nx}:${ny}`;
      if(!S.rooms[nk]){
        hasUnexploredExit=true;
        break;
      }
    }
    if(hasLadderDown)return; // A normal ladder exists — no emergency needed
  }

  if(hasUnexploredExit)return; // Still rooms to explore
  if(hasUnsearchedRoom)return; // Still rooms to search — might find hidden ladder

  // Truly stuck: no ladder, no exits, all searched — spawn an EMERGENCY ESCAPE.
  // This is a forced descent (a collapsing pit / escape shaft), NOT a quick-travel
  // portal. It is flagged + shown distinctly (🕳️) so it's never confused with the
  // 🌀 secret-passage portals in the Quick-Travel section.
  let r=room();
  if(!r.ladder){
    r.ladder={dir:"down",used:false,targetKey:null,emergency:true};
    S.emergencyEscapes=(S.emergencyEscapes||0)+1;
    msg("🕳️ The floor gives way beneath you! An emergency escape shaft opens — the only way is down. (This is a forced descent, not a quick-travel portal.)");
    if(typeof checkAchievements==="function") checkAchievements();
    // On a boss floor, if the floor's boss hasn't appeared yet, it guards the escape.
    if(S.floor%5===0&&!S.bossSpawnedFloors[S.floor]&&!(r.enemy&&r.enemy.hp>0)){
      S.bossSpawnedFloors[S.floor]=true;
      r.enemy=spawnBoss();
      msg(`👑 BOSS FIGHT! ${r.enemy.name} manifests to guard the escape!\n⚡ Abilities: ${r.enemy.abilities.join(" · ")}`);
    }
  }
}
