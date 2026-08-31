// --- TRINKETS & POTIONS ---
// Found during search. Lucky trinkets grant permanent Luck immediately.
// Mystery potions are unidentified — the player gambles on drinking them.

const luckyTrinkets=[
  {name:"Horseshoe",art:"🧲",luck:2,desc:"An old iron horseshoe, worn smooth. They say it catches fortune."},
  {name:"Four-Leaf Clover",art:"🍀",luck:3,desc:"A rare clover pressed in wax. Unmistakably lucky."},
  {name:"Rabbit's Foot",art:"🐇",luck:2,desc:"A soft charm on a leather cord."},
  {name:"Lucky Coin",art:"🪙",luck:2,desc:"A coin that always lands on its edge."},
  {name:"Fortune Medallion",art:"🏅",luck:4,desc:"An engraved medallion humming with fortune."},
  {name:"Wishbone",art:"🦴",luck:2,desc:"Snapped clean down the middle — the lucky half."},
  {name:"Shooting Star Fragment",art:"⭐",luck:5,desc:"A shard of fallen star, still faintly warm."},
  {name:"Dwarven Luck Rune",art:"ᛟ",luck:3,desc:"A carved rune of ancient fortune."}
];

function findTrinket(){
  // Pick a lucky trinket — grants permanent luck immediately
  let t=luckyTrinkets[Math.floor(Math.random()*luckyTrinkets.length)];
  let prefix=questPrefixes[Math.floor(Math.random()*questPrefixes.length)];
  S.stats.luck=(S.stats.luck||0)+t.luck;
  msg(`${t.art} You find a ${prefix} ${t.name}! "${t.desc}" +${t.luck} Luck! (Total: ${eff().luck})`);
  save();render();
}

function findMysteryPotion(){
  // A potion appears — the player must decide to drink or leave it
  let id=crypto.randomUUID();
  S.pendingPotion={id};
  let html=`<div class="discard-overlay" id="potionModal">
    <div class="discard-box">
      <h3>🧪 A Mysterious Potion</h3>
      <p>You find an unmarked vial of swirling liquid. It could be a healing draught... or poison... or something stranger. There's no way to know without drinking.</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">
        <button onclick="drinkPotion()">🧪 Drink it (F)</button>
        ${S.inventory.length<30?`<button onclick="storePotion()">📦 Keep in inventory (K)</button>`:""}
        <button onclick="leavePotion()">🚫 Leave it (C)</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

function drinkPotion(){
  let modal=document.getElementById("potionModal");
  if(modal)modal.remove();
  S.pendingPotion=null;
  applyPotionEffect();
}

// The mystery-potion d20 gamble — shared by immediate drink AND stored-potion drink.
// Outcomes span the full d20 so stats/luck can go UP or DOWN (like HP), plus a rare
// leprosy effect that rots a finger. Roughly 50% beneficial / 50% harmful.
function applyPotionEffect(){
  let roll=d20();
  let pAmp=hasTrait("Potion Amplifier")?1.5:1;
  let statKeys=["str","dex","int","cha"];
  if(roll===20){
    // Legendary elixir — big heal + luck
    let heal=Math.round(effMaxHp()*0.5*pAmp);
    S.hp=Math.min(effMaxHp(),S.hp+heal);
    S.stats.luck=(S.stats.luck||0)+3;
    msg(`✨ A legendary elixir! +${heal} HP and +3 Luck! The liquid was pure fortune.`);
  } else if(roll>=17){
    // Healing potion
    let heal=Math.round(effMaxHp()*(0.3+Math.random()*0.2)*pAmp);
    S.hp=Math.min(effMaxHp(),S.hp+heal);
    msg(`💚 A healing draught! +${heal} HP. (${S.hp}/${effMaxHp()})`);
  } else if(roll>=15){
    // Luck potion (+)
    let luck=1+Math.floor(Math.random()*2);
    S.stats.luck=(S.stats.luck||0)+luck;
    msg(`🍀 A fortune tonic! +${luck} Luck. (Total: ${eff().luck})`);
  } else if(roll>=12){
    // Stat elixir (+) — random stat boost
    let stat=statKeys[Math.floor(Math.random()*4)];
    S.stats[stat]=(S.stats[stat]||0)+2;
    msg(`💪 A strange elixir surges through you! +2 ${stat.toUpperCase()}.`);
  } else if(roll===11){
    // Twin boost — small luck + stat
    let stat=statKeys[Math.floor(Math.random()*4)];
    S.stats.luck=(S.stats.luck||0)+1;
    S.stats[stat]=(S.stats[stat]||0)+1;
    msg(`🌟 A shimmering tonic! +1 Luck and +1 ${stat.toUpperCase()}.`);
  } else if(roll>=8){
    // Mild poison (HP down)
    let dmg=Math.max(2,Math.round(S.maxHp*0.15));
    msg(`🤢 Bitter and foul — it was mild poison! -${dmg} HP.`);
    damage(dmg);
  } else if(roll>=6){
    // Withering draught — a random stat DROPS (min 1)
    let stat=statKeys[Math.floor(Math.random()*4)];
    let cur=S.stats[stat]||1;
    let drop=Math.max(1,Math.round(cur*(0.08+Math.random()*0.07))); // ~8-15%, min 1
    S.stats[stat]=Math.max(1,cur-drop);
    msg(`📉 A withering draught! Your ${stat.toUpperCase()} drains by ${drop}. (now ${S.stats[stat]})`);
  } else if(roll>=4){
    // Misfortune brew — Luck DROPS
    let luckLoss=1+Math.floor(Math.random()*2);
    S.stats.luck=Math.max(0,(S.stats.luck||0)-luckLoss);
    msg(`💔 A misfortune brew! -${luckLoss} Luck. (now ${S.stats.luck||0})`);
  } else if(roll>=2){
    // Nasty poison (HP down, big)
    let dmg=Math.max(3,Math.round(S.maxHp*0.35));
    msg(`☠️ Deadly poison courses through you! -${dmg} HP. You should have been more careful.`);
    damage(dmg);
  } else {
    // roll === 1 — LEPROSY: the flesh rots, claiming a finger (floors 3+),
    // plus a sickly bit of damage. A grim, memorable gamble outcome.
    S.leprosyCount=(S.leprosyCount||0)+1;
    let dmg=Math.max(2,Math.round(S.maxHp*0.1));
    msg(`🦠 LEPROSY! The potion was a rotting curse — your flesh sickens (-${dmg} HP)${S.floor>2?" and a finger begins to rot away...":""}.`);
    damage(dmg);
    if(S.floor>2&&S.hp>0&&typeof loseFinger==="function") loseFinger();
    if(typeof checkAchievements==="function") checkAchievements();
  }
  save();
  if(S.hp>0)render();
}

function leavePotion(){
  let modal=document.getElementById("potionModal");
  if(modal)modal.remove();
  S.pendingPotion=null;
  msg("🚫 You leave the mysterious potion untouched. Better safe than sorry.");
  save();render();
}

// Stash the mystery potion as an inventory item to drink later. Potions STACK up
// to 10 per slot (they're identical unidentified potions). If a non-full stack
// exists, increment it; otherwise take a new inventory slot (if room).
function storePotion(){
  let modal=document.getElementById("potionModal");
  if(modal)modal.remove();
  S.pendingPotion=null;
  const MAX_STACK=10;
  // Find an existing potion stack that isn't full.
  let stack=S.inventory.find(x=>x.type==="potion"&&(x.count||1)<MAX_STACK);
  if(stack){
    stack.count=(stack.count||1)+1;
    msg(`📦 You add the potion to your stash. (${stack.count}/${MAX_STACK})`);
    if(typeof checkAchievements==="function") checkAchievements();
    save();render();return;
  }
  // No room in an existing stack — need a new inventory slot.
  if(S.inventory.length>=30){ msg("🎒 Inventory full — couldn't stash the potion."); save(); render(); return; }
  S.inventory.push({
    id:crypto.randomUUID(),
    type:"potion",
    name:"Mystery Potion",
    art:"🧪",
    rarity:"common",
    depth:"bronze",
    stats:{},
    trait:null,
    count:1
  });
  msg("📦 You carefully stash the mysterious potion for later. (1/10)");
  save();render();
}
window.storePotion=storePotion;

// Drink a previously-stored mystery potion from inventory (same gamble as fresh).
// Decrements the stack; removes the slot only when the last one is drunk.
function drinkStoredPotion(id){
  if(S.hp<=0)return;
  let n=S.inventory.findIndex(x=>x.id===id);
  if(n<0)return;
  let stack=S.inventory[n];
  if((stack.count||1)>1){ stack.count=(stack.count||1)-1; }
  else { S.inventory.splice(n,1); }
  msg("🧪 You unstopper a stashed potion and drink...");
  applyPotionEffect();
}
window.drinkStoredPotion=drinkStoredPotion;
