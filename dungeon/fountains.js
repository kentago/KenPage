// --- REST/FOUNTAIN SYSTEM ---

// Bad luck consequence: fumble and drop a random equipped item (permanently lost).
// Prefers headgear/shield-style slots first (helmet/cape/shoulders/armor), then
// weapon/amulet, then a random ring — flavour: "you drop your shield/headgear".
function dropRandomEquipment(){
  let slotsPriority=["helmet","cape","shoulders","armor","boots","trousers","weapon","amulet"];
  let candidates=slotsPriority.filter(k=>S.equipment[k]);
  // Add equipped rings as candidates too
  let ringIdxs=[];
  S.equipment.rings.forEach((x,i)=>{if(x)ringIdxs.push(i);});
  if(candidates.length===0&&ringIdxs.length===0){
    msg("🍀 ...but you have nothing equipped to lose. Lucky, in a way.");
    return;
  }
  // 70% chance to drop an armor/weapon slot if available, else a ring
  if(candidates.length&&(ringIdxs.length===0||Math.random()<0.7)){
    let k=candidates[Math.floor(Math.random()*candidates.length)];
    let lost=S.equipment[k];
    S.equipment[k]=null;
    let what=k==="helmet"?"headgear":k==="cape"?"cape":k==="shoulders"?"pauldrons":k==="armor"?"body armor":k;
    msg(`😱 In your eagerness you fumble and drop your ${what} — ${lost.name} is lost forever!`);
  } else {
    let ri=ringIdxs[Math.floor(Math.random()*ringIdxs.length)];
    let lost=S.equipment.rings[ri];
    S.equipment.rings[ri]=null;
    msg(`😱 A ring slips from your finger into the depths — ${lost.name} is lost forever!`);
  }
}

// Combined fountain heal multiplier from amulet traits (Potion Amplifier + Potion Brewer stack)
function restHealMult(){
  let m=1;
  if(hasTrait("Potion Amplifier")) m*=1.5;
  if(hasTrait("Potion Brewer")) m*=1.5;
  return m;
}

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
  // Prevent wasting a HEAL fountain sip while at full HP (heal would do nothing
  // and a bad roll could poison you for no benefit). Luck fountains are always useful.
  if(r.rest.type!=="luck"&&S.hp>=effMaxHp()){
    msg(`${r.rest.emoji} You are already at full health — no need to drink from the ${r.rest.name} yet.`);
    return;
  }

  // D20 roll — critical fail means polluted/cursed!
  let roll=d20();

  if(roll===1){
    // CRITICAL FAIL — cursed (luck) / polluted (heal)!
    r.rest.sips--;
    if(r.rest.type==="luck"){
      // Cursed luck fountain — misfortune stacks: lose Luck, maybe drop gear,
      // and maybe drain a random base stat. High-stat heroes have the most to lose.
      let luckLoss=1+Math.floor(Math.random()*2);
      S.stats.luck=Math.max(0,(S.stats.luck||0)-luckLoss);
      msg(`🔮 The ${r.rest.name} turns on you — MISFORTUNE! -${luckLoss} Luck!`);
      // 55% chance the bad luck makes you fumble and lose an equipped item
      if(Math.random()<0.55) dropRandomEquipment();
      // 45% chance a random base stat withers — drains ~5-12% (min 1), so it
      // stings proportionally more for crazy-high stats.
      if(Math.random()<0.45){
        let statKeys=["str","dex","int","cha"];
        let sk=statKeys[Math.floor(Math.random()*statKeys.length)];
        let cur=S.stats[sk]||1;
        let drain=Math.max(1,Math.round(cur*(0.05+Math.random()*0.07)));
        S.stats[sk]=Math.max(1,cur-drain);
        msg(`🌀 A wave of misfortune saps your ${sk.toUpperCase()} by ${drain}!`);
      }
    } else {
      let poisonDmg=Math.max(2,Math.round(effMaxHp()*r.rest.healPct*0.8));
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
      let weakHeal=Math.max(1,Math.round(effMaxHp()*r.rest.healPct*0.3*restHealMult()));
      let poisonDmg=Math.max(1,Math.round(effMaxHp()*0.05));
      let net=weakHeal-poisonDmg;
      S.hp=Math.min(effMaxHp(),Math.max(0,S.hp+net));
      msg(`${r.rest.emoji} The ${r.rest.name} tastes bitter... +${weakHeal} HP but -${poisonDmg} poison. (${S.hp}/${effMaxHp()}) ${r.rest.sips}/${r.rest.maxSips} sips left.`);
    }
    save();render();
    return;
  }

  // --- GOOD SIP ---
  r.rest.sips--;
  // Resting breaks kill streak
  if(r.rest.type==="heal"&&S.killStreak>0){
    if(typeof breakStreak==="function") breakStreak("you stopped to heal"); else { S.killStreak=0; S.roomsSinceKill=0; }
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
    let healAmt=Math.max(1,Math.round(effMaxHp()*r.rest.healPct*healMult*restHealMult()));
    let oldHp=S.hp;
    S.hp=Math.min(effMaxHp(),S.hp+healAmt);
    let actualHeal=S.hp-oldHp;
    let bonusMsg=roll>=20?" 💥 The waters glow with divine power!":roll>=17?" ✨ An exceptionally refreshing sip!":"";

    if(r.rest.sips<=0){
      r.rest.depleted=true;
      msg(`${r.rest.emoji} You drink from the ${r.rest.name}.${bonusMsg} +${actualHeal} HP (${S.hp}/${effMaxHp()}). 💚 Depleted — no sips remain.`);
    } else {
      msg(`${r.rest.emoji} You drink from the ${r.rest.name}.${bonusMsg} +${actualHeal} HP (${S.hp}/${effMaxHp()}). ${r.rest.sips}/${r.rest.maxSips} sips remaining.`);
    }
  }
  save();render();
}
window.useRest=useRest;
