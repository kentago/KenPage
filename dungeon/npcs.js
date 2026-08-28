// --- NPC SYSTEM ---

// Quest difficulty determines how far away the item likely is
const questDifficulty=["nearby","moderate","distant","legendary"];

function uniqueQuestItemName(){
  // Pick a base name, ensure it's not already active
  let activeNames=S.quests.map(q=>q.itemName);
  let attempts=0;
  let name;
  do{
    name=questItems[Math.floor(Math.random()*questItems.length)];
    if(!activeNames.includes(name)) return name;
    // Duplicate — add periodic table prefix
    let prefix=questPrefixes[Math.floor(Math.random()*questPrefixes.length)];
    name=`${prefix} ${name}`;
    attempts++;
  } while(activeNames.includes(name)&&attempts<10);
  return name;
}

function spawnNPC(){
  let name=npcNames[Math.floor(Math.random()*npcNames.length)];
  let title=npcTitles[Math.floor(Math.random()*npcTitles.length)];
  let questItem=uniqueQuestItemName();

  // Difficulty = how many floors down the item is hidden
  // This determines both reward AND where you need to search
  let floorsDown=0;
  let diffRoll=Math.random();
  if(diffRoll<0.35) floorsDown=0; // Same floor
  else if(diffRoll<0.60) floorsDown=1; // 1 floor down
  else if(diffRoll<0.80) floorsDown=2; // 2 floors down
  else if(diffRoll<0.92) floorsDown=3; // 3 floors down
  else floorsDown=4+Math.floor(Math.random()*3); // 4-6 floors down (legendary)

  let diff=floorsDown===0?"same floor":floorsDown===1?"1 floor down":floorsDown<=3?`${floorsDown} floors down`:"deep below";
  let targetFloor=S.floor+floorsDown;

  // XP reward scales with distance and danger at target floor
  let targetDanger=Math.pow(targetFloor,1.6);
  let baseXP=Math.round(targetDanger*(0.8+floorsDown*0.5)+20+floorsDown*30);

  // Item reward chance (further = better rewards)
  let itemReward=null;
  if(floorsDown>=4||(floorsDown>=3&&Math.random()<0.4)){
    itemReward=true;
  }

  // Clear, specific hint so player knows exactly where to search
  let hint=floorsDown===0?`"It is hidden somewhere on this very floor. Search every chamber."`:
           floorsDown===1?`"I last saw it one floor below. Descend and search carefully."`:
           floorsDown<=3?`"It lies ${floorsDown} floors beneath us. You must descend and explore floor ${targetFloor}."`:
           `"It is buried deep — floor ${targetFloor} or beyond. A perilous journey awaits."`;

  return{name,title,questItem,xpReward:baseXP,difficulty:diff,targetFloor,floorsDown,hint,itemReward,completed:false};
}

function talkNPC(){
  if(S.hp<=0)return;
  let r=room();
  if(!r.npc||r.npc.completed)return;

  // Each NPC has unique ID by room location
  if(!r.npc.id) r.npc.id=`npc_${S.floor}:${S.x}:${S.y}`;

  // Check if player has THIS NPC's quest item found
  let existingQuest=S.quests.find(q=>q.npcId===r.npc.id&&q.found);
  if(existingQuest){
    deliverQuest(r.npc,existingQuest);
    return;
  }

  // Check if THIS NPC's quest is already active
  let active=S.quests.find(q=>q.npcId===r.npc.id);
  if(active){
    msg(`🔵 ${r.npc.name} says: "Still searching for the ${r.npc.questItem}? ${r.npc.hint}"`);
    return;
  }

  // Give new quest tied to THIS specific NPC
  let quest={
    npcId:r.npc.id,
    npcName:r.npc.name,
    itemName:r.npc.questItem,
    found:false,
    npcFloor:S.floor,
    npcX:S.x,
    npcY:S.y,
    xpReward:r.npc.xpReward,
    difficulty:r.npc.difficulty,
    targetFloor:r.npc.targetFloor,
    floorsDown:r.npc.floorsDown,
    itemReward:r.npc.itemReward
  };
  S.quests.push(quest);
  let diffLabel=r.npc.difficulty==="nearby"?"⚪":r.npc.difficulty==="moderate"?"🔵":r.npc.difficulty==="distant"?"🟠":"🟣";
  msg(`🔵 ${r.npc.name}, ${r.npc.title}, has a quest:\n\nFind: "${r.npc.questItem}" ${diffLabel} ${r.npc.difficulty}\n${r.npc.hint}\nReward: ${r.npc.xpReward} XP${r.npc.itemReward?" + 🎁 Special item":""}`);
  save();render();
}

function deliverQuest(npc,quest){
  // Award XP
  // CHA bonus: +5% quest XP per CHA point (being charming = better rewards)
  let chaXPBonus=1+(eff().cha||1)*0.05;
  let finalQuestXP=Math.round(quest.xpReward*chaXPBonus);
  // Soul Chain: +5% XP per ring worn · XP Amplifier: +15% XP from all sources
  let xpTraitMult=1;
  if(hasTrait("Soul Chain")) xpTraitMult*=(1+0.05*S.equipment.rings.filter(x=>x).length);
  if(hasTrait("XP Amplifier")) xpTraitMult*=1.15;
  finalQuestXP=Math.round(finalQuestXP*xpTraitMult);
  S.xp+=finalQuestXP;

  // --- REWARD ROLL (d20 + luck) ---
  // Even low-floor quests can give items with a lucky roll!
  let luckBonus=eff().luck||0; // Luck from stats + gear + traits
  let rewardRoll=d20()+luckBonus;
  let giveItem=false;

  if(quest.itemReward){
    // Guaranteed item for deep quests
    giveItem=true;
  } else if(rewardRoll>=20){
    // Lucky roll! Bonus item even on nearby quests
    giveItem=true;
    msg(`🍀 Lucky reward! The NPC is so grateful they give you something extra!`);
  } else if(rewardRoll>=17&&(quest.floorsDown||0)>=1){
    // Good roll + at least 1 floor distance
    giveItem=true;
    msg(`🍀 Bonus reward!`);
  }

  if(giveItem){
    let rewardItem=makeItem(types[Math.floor(Math.random()*types.length)]);
    // Quest reward items are at least uncommon and get a bonus
    if(rewardItem.rarity==="common") rewardItem.rarity="uncommon";
    // Boost scales with quest distance
    let boost=1.2+Math.random()*0.4+(quest.floorsDown||0)*0.15;
    for(let k in rewardItem.stats) rewardItem.stats[k]=Math.round(rewardItem.stats[k]*boost);
    // Ensure a trait
    if(!rewardItem.trait){
      let pool=rewardItem.type==="ring"&&Math.random()<0.6?ringTraits:traits;
      rewardItem.trait=pool[Math.floor(Math.random()*pool.length)];
    }
    msg(`🎁 ${npc.name} rewards you with: ${rewardItem.name}! ${obtain(rewardItem)}`);
  }

  // Chance of bonus potion/trinket on high luck
  if(rewardRoll>=18){
    let potionRoll=Math.random();
    if(potionRoll<0.3){
      S.stats.luck=(S.stats.luck||0)+1;
      msg(`🧪 ${npc.name} also slips you a Lucky Trinket. (+1 Luck permanently!)`);
    } else if(potionRoll<0.5){
      let healAmt=Math.round(effMaxHp()*0.3);
      S.hp=Math.min(effMaxHp(),S.hp+healAmt);
      msg(`🧪 ${npc.name} gives you a Healing Potion. (+${healAmt} HP!)`);
    }
  }

  // Remove quest from active quests
  S.quests=S.quests.filter(q=>q!==quest);
  // Mark NPC as completed
  npc.completed=true;
  // Check level up
  checkLevelUp();
  msg(`✅ ${npc.name} accepts the ${quest.itemName}!\n🎉 +${finalQuestXP} XP awarded!${chaXPBonus>1.1?` (CHA bonus: +${Math.round((chaXPBonus-1)*100)}%)`:""}`);
  save();render();
}

function checkLevelUp(){
  let needed=S.level*50+S.level*S.level*10;
  while(S.xp>=needed){
    S.level++;
    // HP gain scales with level — deep players get tanky
    let hpGain=5+Math.floor(S.level*2.5);
    S.maxHp+=hpGain;
    let heal=Math.floor(hpGain*0.8);
    S.hp=Math.min(S.maxHp,S.hp+heal);
    // Give stat points to allocate (3-4 points depending on level)
    let points=3+Math.floor(S.level/10); // 3 base, +1 extra every 10 levels
    S.statPoints=(S.statPoints||0)+points;
    msg(`📈 Level ${S.level}! +${hpGain} Max HP, healed ${heal}. You have ${S.statPoints} stat points to spend!`);
    needed=S.level*50+S.level*S.level*10;
  }
}
