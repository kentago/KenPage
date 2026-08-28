// --- DOCTOR SYSTEM ---
// Doctors (⚕️) can restore lost fingers for gold. Price scales with floor depth.
// BULK DISCOUNT: restoring more fingers in one visit makes each additional one cheaper.
const doctorNames=["Physician Thrand","Bonesetter Vigga","Healer Orin","Surgeon Brakka","Mender Dwalia","Leechmaster Grum","Apothecary Sindri","Chirurgeon Yrsa"];
const doctorTitles=["Field Surgeon","Deep Healer","Bone Mender","Battle Physician","Restorer of Flesh","Master Chirurgeon"];

function spawnDoctor(){
  let name=doctorNames[Math.floor(Math.random()*doctorNames.length)];
  let title=doctorTitles[Math.floor(Math.random()*doctorTitles.length)];
  return{name,title};
}

// Base price for ONE finger at current floor
function fingerBaseCost(){
  return Math.round(Math.pow(S.floor,1.4)*3+50);
}

// Bulk discount multipliers: 1st full price, 2nd 70%, 3rd 50%, 4th+ 40%
function bulkMultiplier(n){
  // n = which finger in the bundle (1-based)
  if(n===1) return 1.0;
  if(n===2) return 0.7;
  if(n===3) return 0.5;
  return 0.4;
}

// Total cost to restore `count` fingers this visit
function bundleCost(count){
  let base=fingerBaseCost();
  let total=0;
  for(let i=1;i<=count;i++) total+=Math.round(base*bulkMultiplier(i));
  return total;
}

function getLostFingers(){
  let lost=[];
  if(S.lostFingers){
    S.lostFingers.left.forEach(i=>lost.push({hand:"left",idx:i,label:`Left hand, finger ${i+1}`}));
    S.lostFingers.right.forEach(i=>lost.push({hand:"right",idx:i,label:`Right hand, finger ${i+1}`}));
  }
  return lost;
}

function talkDoctor(){
  if(S.hp<=0)return;
  let r=room();
  if(!r.doctor)return;
  showDoctorModal(r.doctor);
}

function showDoctorModal(doctor){
  let lost=getLostFingers();
  let base=fingerBaseCost();

  let body;
  if(lost.length===0){
    body=`<p>"${doctor.name} examines your hands." — "All ten fingers intact! Come back if you lose one in the depths."</p>`;
  } else {
    // Build bundle options: restore 1, 2, 3... up to all lost fingers
    let options="";
    for(let count=1;count<=lost.length;count++){
      let cost=bundleCost(count);
      let afford=(S.gold||0)>=cost;
      let saving=count>1?` (save ${count*base-cost} 💰)`:"";
      options+=`<div class="item">
        <b>Restore ${count} finger${count>1?"s":""}</b>${saving}
        <button onclick="restoreFingers(${count})" ${afford?"":"disabled"}>⚕️ ${cost} 💰${afford?"":" (need gold)"}</button>
      </div>`;
    }
    body=`<p>"I can regrow lost fingers. One costs <b>${base} 💰</b> — but the more you fix at once, the cheaper each becomes. You have ${S.gold||0} 💰."</p>
      <p class="small">⚠️ Deep-dungeon surgery is risky — not every doctor is trustworthy...</p>
      <p class="small">You have ${lost.length} lost finger${lost.length>1?"s":""}: ${lost.map(f=>f.label).join(", ")}</p>
      <div class="discard-list">${options}</div>`;
  }

  // --- CHEAP HEAL (always offered) ---
  let healCost=healSipCost();
  let healAmt=Math.round(effMaxHp()*0.35*(hasTrait("Potion Amplifier")?1.5:1));
  let needsHeal=S.hp<effMaxHp();
  let canAfford=(S.gold||0)>=healCost;
  let healSection=needsHeal
    ? `<h4>💧 Healing Sip</h4><div class="item"><b>Restore ~${healAmt} HP</b> <span class="small">(current ${S.hp}/${effMaxHp()})</span>
        <button class="rest-btn" onclick="doctorHeal()" ${canAfford?"":"disabled"}>💧 ${healCost} 💰${canAfford?"":" (need gold)"}</button>
      </div>`
    : `<h4>💧 Healing Sip</h4><div class="small">You're at full health — no sip needed.</div>`;

  let html=`<div class="discard-overlay" id="doctorModal">
    <div class="discard-box">
      <h3>⚕️ ${doctor.name}, ${doctor.title}</h3>
      ${body}
      ${healSection}
      <button onclick="document.getElementById('doctorModal').remove()">Leave</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

// Healing sip cost — scales with BOTH the HP restored and floor depth,
// so it always costs a meaningful chunk of your gold (never trivial pocket change).
// A 35% heal of a big HP pool is genuinely valuable, so it's priced accordingly.
function healSipCost(){
  let healAmt=Math.round(S.maxHp*0.35);
  // ~1.2 gold per HP restored, plus a floor premium
  return Math.max(8,Math.round(healAmt*1.2+Math.pow(S.floor,1.3)*2));
}

function doctorHeal(){
  if(S.hp<=0)return;
  let r=room();
  if(!r.doctor)return;
  if(S.hp>=effMaxHp()){ msg("💧 You are already at full health."); return; }
  let cost=healSipCost();
  if((S.gold||0)<cost){ msg(`💧 Not enough gold. The sip costs ${cost}, you have ${S.gold||0}.`); return; }
  let modal=document.getElementById("doctorModal");
  if(modal)modal.remove();
  S.gold-=cost;
  let healAmt=Math.round(effMaxHp()*0.35*(hasTrait("Potion Amplifier")?1.5:1));
  let old=S.hp;
  S.hp=Math.min(effMaxHp(),S.hp+healAmt);
  msg(`💧 ${r.doctor.name} shares a healing sip. +${S.hp-old} HP (${S.hp}/${effMaxHp()}). -${cost} 💰`);
  save();
  // Reopen so player can heal again or restore fingers
  if(r.doctor) showDoctorModal(r.doctor);
  else render();
}

function restoreFingers(count){
  let cost=bundleCost(count);
  if((S.gold||0)<cost){
    msg(`⚕️ Not enough gold. That costs ${cost}, you have ${S.gold||0}.`);
    return;
  }
  let lost=getLostFingers();
  if(count>lost.length) count=lost.length;
  if(count<=0)return;

  let modal=document.getElementById("doctorModal");
  if(modal)modal.remove();

  // Gold is taken upfront
  S.gold-=cost;

  // --- D20 SURGERY ROLL ---
  let roll=d20();

  if(roll===1){
    // CRITICAL FAIL — questionable doctor! Took the money and fled.
    let r=room();
    r.doctor=null; // the doctor vanishes forever
    let bad=Math.random();
    if(bad<0.4){
      // Fled with the gold, no surgery done
      msg(`💀 The "doctor" pockets your ${cost} 💰, mutters an excuse, and vanishes into the shadows — never to be found again. No surgery performed!`);
    } else if(bad<0.75){
      // Botched — actually severed ANOTHER finger instead of healing
      msg(`💀 The surgery goes horribly wrong! The quack takes your ${cost} 💰 AND botches the operation...`);
      loseFinger();
      let r2=room(); if(r2) r2.doctor=null;
    } else {
      // Poisoned syringe
      let poison=Math.max(3,Math.round(S.maxHp*0.25));
      msg(`💀 A dirty syringe! You take ${poison} poison damage and the charlatan flees with your ${cost} 💰.`);
      damage(poison);
    }
    save();
    if(S.hp>0) render();
    return;
  }

  if(roll<=3){
    // Partial failure — only restores half (rounded down), keeps full payment
    let actual=Math.max(1,Math.floor(count/2));
    doRestore(actual);
    msg(`⚕️ The trembling surgeon only manages ${actual} of ${count} finger${count>1?"s":""}, but keeps the full ${cost} 💰. "Steady hands are hard down here..."`);
    save();
    let r=room();
    if(r.doctor&&getLostFingers().length>0) showDoctorModal(r.doctor);
    else render();
    return;
  }

  // Success (roll 4-20)
  let bonusMsg="";
  if(roll===20){
    // Critical success — refund half the cost!
    let refund=Math.floor(cost*0.5);
    S.gold+=refund;
    bonusMsg=` 💥 Masterful work! The surgeon refunds ${refund} 💰 out of pride.`;
  }
  let restored=doRestore(count);
  msg(`⚕️ The surgeon restores ${count} finger${count>1?"s":""}: ${restored.join(", ")}. (-${cost} 💰)${bonusMsg} Ring slots usable again!`);
  save();
  let r=room();
  if(r.doctor&&getLostFingers().length>0) showDoctorModal(r.doctor);
  else render();
}

// Helper: actually remove `count` fingers from the lost lists
function doRestore(count){
  let lost=getLostFingers();
  let restored=[];
  for(let c=0;c<count&&c<lost.length;c++){
    let f=lost[c];
    let arr=f.hand==="left"?S.lostFingers.left:S.lostFingers.right;
    let pos=arr.indexOf(f.idx);
    if(pos>=0) arr.splice(pos,1);
    restored.push(`${f.hand==="left"?"Left":"Right"} finger ${f.idx+1}`);
  }
  S.fingersRestored=(S.fingersRestored||0)+restored.length;
  return restored;
}
