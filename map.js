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
          symbol=rm.ladder.used?"🪜↓":"🪜↓";
          cellClass+=rm.ladder.used?" ladder-used":" ladder-down";
        } else if(rm.ladder&&rm.ladder.dir==="up"){
          symbol=rm.ladder.used?"🪜↑":"🪜↑";
          cellClass+=rm.ladder.used?" ladder-used":" ladder-up";
        } else if(rm.secret){
          symbol="✦";
          cellClass+=" secret";
        } else if(rm.rest&&!rm.rest.depleted){
          symbol="💚";
          cellClass+=" rest-source";
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

  // Truly stuck: no ladder, no exits, all searched — spawn emergency portal
  let r=room();
  if(!r.ladder){
    r.ladder={dir:"down",used:false,targetKey:null};
    msg("🌀 The walls shimmer... A mysterious portal materializes! The dungeon demands you descend.");
  }
}
