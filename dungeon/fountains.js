// --- REST/FOUNTAIN SYSTEM ---

function spawnRestSource(){
  let source=restSources[Math.floor(Math.random()*restSources.length)];
  // d20 determines how many sips (3-12 range, higher = luckier)
  let sips=3+Math.floor(d20()*0.5);
  // Heal amount = % of maxHP (15-35%, so always relevant)
  let healPct=0.15+Math.random()*0.20;
  return{name:source.name,emoji:source.emoji,type:source.type,sips,maxSips:sips,healPct,depleted:false};
}

function useRest(){
  if(S.hp<=0)return;
  let r=room();
  if(!r.rest||r.rest.depleted)return;
  if(r.rest.sips<=0){
    r.rest.depleted=true;
    msg(`${r.rest.emoji} ${r.rest.name} is depleted. Nothing remains.`);
    save();render();
    return;
  }

  // D20 roll — critical fail means polluted/cursed!
  let roll=d20();

  if(roll===1){
    // CRITICAL FAIL — poisoned/cursed!
    r.rest.sips--;
    if(r.rest.type==="luck"){
      // Cursed luck fountain — LOSE luck
      let luckLoss=1+Math.floor(Math.random()*2);
      S.stats.luck=Math.max(0,(S.stats.luck||0)-luckLoss);
      msg(`🔮 The ${r.rest.name} is CURSED! Misfortune washes over you. -${luckLoss} Luck!`);
    } else {
      let poisonDmg=Math.max(2,Math.round(S.maxHp*r.rest.healPct*0.8));
      msg(`☠️ The ${r.rest.name} is POLLUTED! You drink tainted water and take ${poisonDmg} poison damage!`);
      damage(poisonDmg);
    }
    // 20% chance permanently corrupted
    if(Math.random()<0.20){
      r.rest.depleted=true;
      if(r.rest.type==="luck"){
        msg(`💀 The ${r.rest.name} dims and goes dark. Its magic is forever broken.`);
      } else {
        msg(`🟤 The ${r.rest.name} turns foul and black. It is permanently corrupted.`);
      }
    }
    save();render();
    return;
  }

  if(roll<=3){
    // Bad sip — reduced effect + minor negative
    r.rest.sips--;
    if(r.rest.type==="luck"){
      msg(`${r.rest.emoji} The ${r.rest.name} flickers dimly... No effect this time. ${r.rest.sips}/${r.rest.maxSips} sips left.`);
    } else {
      let weakHeal=Math.max(1,Math.round(S.maxHp*r.rest.healPct*0.3));
      let poisonDmg=Math.max(1,Math.round(S.maxHp*0.05));
      let net=weakHeal-poisonDmg;
      S.hp=Math.min(S.maxHp,Math.max(0,S.hp+net));
      msg(`${r.rest.emoji} The ${r.rest.name} tastes bitter... +${weakHeal} HP but -${poisonDmg} poison. (${S.hp}/${S.maxHp}) ${r.rest.sips}/${r.rest.maxSips} sips left.`);
    }
    save();render();
    return;
  }

  // --- GOOD SIP ---
  r.rest.sips--;
  // Resting breaks kill streak
  if(r.rest.type==="heal"&&S.killStreak>0){
    S.killStreak=0;
  }

  if(r.rest.type==="luck"){
    // Luck fountain — boost luck and other finding bonuses
    let luckGain=roll>=20?3:roll>=17?2:1;
    S.stats.luck=(S.stats.luck||0)+luckGain;
    let bonusMsg=roll>=20?" 💥 The stars align! Massive fortune!":roll>=17?" ✨ Fortune smiles upon you!":"";
    if(r.rest.sips<=0){
      r.rest.depleted=true;
      msg(`${r.rest.emoji} You gaze into the ${r.rest.name}.${bonusMsg} +${luckGain} Luck! (Total: ${S.stats.luck}) 🍀 Depleted — the magic fades.`);
    } else {
      msg(`${r.rest.emoji} You gaze into the ${r.rest.name}.${bonusMsg} +${luckGain} Luck! (Total: ${S.stats.luck}) ${r.rest.sips}/${r.rest.maxSips} sips remaining.`);
    }
  } else {
    // Heal fountain
    let healMult=roll>=20?1.5:roll>=17?1.2:1.0;
    let healAmt=Math.max(1,Math.round(S.maxHp*r.rest.healPct*healMult));
    let oldHp=S.hp;
    S.hp=Math.min(S.maxHp,S.hp+healAmt);
    let actualHeal=S.hp-oldHp;
    let bonusMsg=roll>=20?" 💥 The waters glow with divine power!":roll>=17?" ✨ An exceptionally refreshing sip!":"";

    if(r.rest.sips<=0){
      r.rest.depleted=true;
      msg(`${r.rest.emoji} You drink from the ${r.rest.name}.${bonusMsg} +${actualHeal} HP (${S.hp}/${S.maxHp}). 💚 Depleted — no sips remain.`);
    } else {
      msg(`${r.rest.emoji} You drink from the ${r.rest.name}.${bonusMsg} +${actualHeal} HP (${S.hp}/${S.maxHp}). ${r.rest.sips}/${r.rest.maxSips} sips remaining.`);
    }
  }
  save();render();
}
window.useRest=useRest;
