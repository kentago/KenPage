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

  // XP reward scales with distance and danger at target floor.
  // Deep-travel quests get a strong effort multiplier so a long round-trip
  // (descend N floors, find item, climb back) is always well rewarded.
  let targetDanger=Math.pow(targetFloor,1.6);
  let effortMult=1+floorsDown*0.6;               // +60% per floor of required travel
  let baseXP=Math.round((targetDanger*(0.8+floorsDown*0.5)+20+floorsDown*30)*effortMult);
  // Also add gold reward on deeper quests to sweeten the trip
  let goldReward=floorsDown>=2?Math.round(Math.pow(targetFloor,1.2)*floorsDown):0;

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

  return{name,title,questItem,xpReward:baseXP,goldReward,difficulty:diff,targetFloor,floorsDown,hint,itemReward,completed:false};
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
    goldReward:r.npc.goldReward||0,
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
  // CHA bonus: +5% quest XP per CHA point (being charming = better rewards).
  // HARD CAP at +150% — CHA can reach the thousands at depth, and an uncapped
  // multiplier produced absurd bonuses (e.g. +65490%) that broke progression.
  let chaXPBonus=1+Math.min(1.5,(eff().cha||1)*0.05);
  let finalQuestXP=Math.round(quest.xpReward*chaXPBonus);
  // Soul Chain: +5% XP per ring worn · XP Amplifier: +15% XP from all sources
  let xpTraitMult=1;
  if(hasTrait("Soul Chain")) xpTraitMult*=(1+0.05*S.equipment.rings.filter(x=>x).length);
  if(hasTrait("XP Amplifier")) xpTraitMult*=1.15;
  finalQuestXP=Math.round(finalQuestXP*xpTraitMult);
  S.xp+=finalQuestXP;

  // Gold reward for deeper quests
  if(quest.goldReward>0){
    S.gold=(S.gold||0)+quest.goldReward;
    S.goldEarned=(S.goldEarned||0)+quest.goldReward;
  }

  // --- REWARD ROLL (Luck as an ASYMPTOTIC percentage — endless-friendly) ---
  // luckChance() (items.js) approaches 90% but never reaches it: every extra luck
  // point always helps a little, yet rewards are never guaranteed.
  let luck=eff().luck||0;
  let giveItem=false;
  if(quest.itemReward){
    // Guaranteed item for deep/legendary quests (unchanged)
    giveItem=true;
  } else {
    let deep=(quest.floorsDown||0)>=1;
    let chance=deep?luckChance(luck,0.20,60):luckChance(luck,0.05,90);
    if(Math.random()<chance){
      giveItem=true;
      msg(deep?`🍀 Bonus reward!`:`🍀 Lucky reward! The NPC is so grateful they give you something extra!`);
    }
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

  // Bonus potion/trinket — same asymptotic luck curve (base 12%, approaches 90%).
  if(Math.random()<luckChance(luck,0.12,90)){
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

  // Remove quest from active quests and archive it as completed (for the trophy list)
  S.quests=S.quests.filter(q=>q!==quest);
  if(!S.completedQuests) S.completedQuests=[];
  S.completedQuests.unshift({
    itemName:quest.itemName,
    npcName:quest.npcName,
    xpAwarded:finalQuestXP,
    floor:S.floor,
    itemReward:quest.itemReward
  });
  // Mark NPC as completed
  npc.completed=true;
  // Track total quests delivered (for achievements)
  S.questsDelivered=(S.questsDelivered||0)+1;
  // Check level up
  checkLevelUp();
  let goldMsg=quest.goldReward>0?` · +${quest.goldReward} 💰`:"";
  msg(`✅ ${npc.name} accepts the ${quest.itemName}!\n🎉 +${finalQuestXP} XP${goldMsg} awarded!${chaXPBonus>1.1?` (CHA bonus: +${Math.round((chaXPBonus-1)*100)}%)`:""}`);
  // Achievement milestones
  checkQuestAchievements();
  save();render();
}

// --- QUEST ACHIEVEMENTS ---
// Delivering milestone quest counts grants a lump XP + gold bonus.
const questMilestones=[
  {count:1,xp:100,gold:50,title:"First Delivery"},
  {count:5,xp:500,gold:200,title:"Errand Runner"},
  {count:10,xp:1500,gold:500,title:"Trusted Courier"},
  {count:20,xp:4000,gold:1200,title:"Master Fetcher"},
  {count:50,xp:15000,gold:4000,title:"Legendary Quest-Bearer"},
  {count:100,xp:50000,gold:12000,title:"Grand Emissary"}
];

function checkQuestAchievements(){
  if(!S.questAchievements) S.questAchievements=[];
  let n=S.questsDelivered||0;
  for(let m of questMilestones){
    if(n>=m.count&&!S.questAchievements.includes(m.count)){
      S.questAchievements.push(m.count);
      // Scale the reward with the current floor so it stays relevant deep down
      let floorScale=1+Math.pow(S.floor,1.2)*0.02;
      let xpBonus=Math.round(m.xp*floorScale);
      let goldBonus=Math.round(m.gold*floorScale);
      S.xp+=xpBonus;
      S.gold=(S.gold||0)+goldBonus;
      msg(`🏆 ACHIEVEMENT: ${m.title}! ${m.count} quest${m.count>1?"s":""} delivered.\n🎁 Bonus: +${xpBonus} XP · +${goldBonus} 💰`);
      checkLevelUp();
    }
  }
}

function checkLevelUp(){
  let needed=xpForLevel(S.level);
  while(S.xp>=needed){
    S.level++;
    // HP gain scales with level — deep players get tanky
    let hpGain=5+Math.floor(S.level*2.5);
    S.maxHp+=hpGain;
    let heal=Math.floor(hpGain*0.8);
    S.hp=Math.min(S.maxHp,S.hp+heal);
    // Give stat points to allocate. Grows slowly and is HARD-CAPPED so deep
    // heroes don't gain dozens of points per level (which made them absurdly
    // strong). 3 base, +1 every 25 levels, capped at 6.
    let points=Math.min(6,3+Math.floor(S.level/25));
    S.statPoints=(S.statPoints||0)+points;
    msg(`📈 Level ${S.level}! +${hpGain} Max HP, healed ${heal}. You have ${S.statPoints} stat points to spend!`);
    needed=xpForLevel(S.level);
  }
  if(typeof checkAchievements==="function") checkAchievements();
}

// Cumulative XP required to advance FROM the given level to the next.
// Steep cubic growth so each level costs meaningfully more than the last, and
// high levels demand many more kills — keeping the game challenging at depth.
// Early levels are only mildly harder; deep levels cost ~2.6x the old curve.
function xpForLevel(level){
  return Math.round(level*80 + level*level*25 + level*level*level*4);
}
