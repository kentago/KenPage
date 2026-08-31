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
      <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
        <button onclick="drinkPotion()">🧪 Drink it (F)</button>
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

  // d20 roll decides the potion's true nature
  let roll=d20();
  let pAmp=hasTrait("Potion Amplifier")?1.5:1;
  if(roll===20){
    // Elixir of legends — big heal + luck
    let heal=Math.round(effMaxHp()*0.5*pAmp);
    S.hp=Math.min(effMaxHp(),S.hp+heal);
    S.stats.luck=(S.stats.luck||0)+3;
    msg(`✨ A legendary elixir! +${heal} HP and +3 Luck! The liquid was pure fortune.`);
  } else if(roll>=15){
    // Healing potion
    let heal=Math.round(effMaxHp()*(0.3+Math.random()*0.2)*pAmp);
    S.hp=Math.min(effMaxHp(),S.hp+heal);
    msg(`💚 A healing draught! +${heal} HP. (${S.hp}/${effMaxHp()})`);
  } else if(roll>=11){
    // Luck potion
    let luck=1+Math.floor(Math.random()*2);
    S.stats.luck=(S.stats.luck||0)+luck;
    msg(`🍀 A fortune tonic! +${luck} Luck. (Total: ${eff().luck})`);
  } else if(roll>=7){
    // Stat elixir — random stat boost
    let stat=["str","dex","int","cha"][Math.floor(Math.random()*4)];
    S.stats[stat]=(S.stats[stat]||0)+2;
    msg(`💪 A strange elixir surges through you! +2 ${stat.toUpperCase()}.`);
  } else if(roll>=3){
    // Mild poison
    let dmg=Math.max(2,Math.round(S.maxHp*0.15));
    msg(`🤢 Bitter and foul — it was mild poison! -${dmg} HP.`);
    damage(dmg);
  } else {
    // Nasty poison
    let dmg=Math.max(3,Math.round(S.maxHp*0.35));
    msg(`☠️ Deadly poison courses through you! -${dmg} HP. You should have been more careful.`);
    damage(dmg);
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
