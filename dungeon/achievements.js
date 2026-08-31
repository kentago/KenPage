// --- ACHIEVEMENTS ---
// General milestone tracking across the whole run. Each achievement fires once,
// grants a floor-scaled XP + gold bonus, and is remembered in S.achievements.
// Progress metrics are read from live game state.

const ACHIEVEMENTS=[
  // Kills
  {id:"kills10",metric:"totalKills",need:10,title:"Bloodied Blade",desc:"Slay 10 foes",xp:200,gold:60},
  {id:"kills100",metric:"totalKills",need:100,title:"Century of Slaughter",desc:"Slay 100 foes",xp:2500,gold:800},
  {id:"kills500",metric:"totalKills",need:500,title:"Butcher of the Deep",desc:"Slay 500 foes",xp:15000,gold:4000},
  // Gold accumulated (lifetime earned tracked via goldEarned)
  {id:"gold1k",metric:"goldEarned",need:1000,title:"Coin Collector",desc:"Earn 1,000 gold",xp:400,gold:0},
  {id:"gold10k",metric:"goldEarned",need:10000,title:"Deep Treasurer",desc:"Earn 10,000 gold",xp:4000,gold:0},
  {id:"gold100k",metric:"goldEarned",need:100000,title:"Dragon-Hoarder",desc:"Earn 100,000 gold",xp:30000,gold:0},
  // Gold SPENT (tolls, traders, restocks, doctors) — rewards engaging with sinks (v1.1)
  {id:"spend1k",metric:"goldSpent",need:1000,title:"Big Spender",desc:"Spend 1,000 gold",xp:400,gold:0},
  {id:"spend10k",metric:"goldSpent",need:10000,title:"Free-Handed",desc:"Spend 10,000 gold",xp:4000,gold:0},
  {id:"spend100k",metric:"goldSpent",need:100000,title:"Gold Burns a Hole",desc:"Spend 100,000 gold",xp:30000,gold:0},
  {id:"cleanhouse",metric:"cleanHouse",need:1,title:"Clean House",desc:"Buy out a trader's entire stock",xp:800,gold:0},
  {id:"allrings",metric:"allFingersRinged",need:1,title:"Bejeweled",desc:"Wear a ring on every intact finger at once",xp:1500,gold:400},
  {id:"elixir10",metric:"maxPotionStack",need:10,title:"Elixir Collector",desc:"Save a full stack of 10 potions",xp:1200,gold:400},
  {id:"leprosy1",metric:"leprosyCount",need:1,title:"Unclean",desc:"Suffer leprosy from a cursed potion",xp:900,gold:300},
  {id:"fullgear",metric:"fullyEquipped",need:1,title:"Fully Equipped",desc:"Fill EVERY slot: all 8 gear pieces + all 10 rings (restore lost fingers first!)",xp:2000,gold:500},
  // Fingers lost
  {id:"fingers1",metric:"fingersLostTotal",need:1,title:"Flesh Price",desc:"Lose your first finger",xp:150,gold:100},
  {id:"fingers5",metric:"fingersLostTotal",need:5,title:"Nine and Counting",desc:"Lose 5 fingers total",xp:1200,gold:600},
  {id:"fingers10",metric:"fingersLostTotal",need:10,title:"Handless Legend",desc:"Lose all 10 fingers",xp:8000,gold:3000},
  // Floors reached
  {id:"floor5",metric:"deepestFloor",need:5,title:"Descender",desc:"Reach floor 5",xp:300,gold:100},
  {id:"floor10",metric:"deepestFloor",need:10,title:"Deep Delver",desc:"Reach floor 10",xp:1000,gold:300},
  {id:"floor25",metric:"deepestFloor",need:25,title:"Abyss Walker",desc:"Reach floor 25",xp:6000,gold:1500},
  {id:"floor50",metric:"deepestFloor",need:50,title:"Lord of the Depths",desc:"Reach floor 50",xp:25000,gold:8000},
  // Level
  {id:"lvl10",metric:"level",need:10,title:"Seasoned",desc:"Reach level 10",xp:500,gold:150},
  {id:"lvl25",metric:"level",need:25,title:"Veteran",desc:"Reach level 25",xp:4000,gold:1000},
  {id:"lvl50",metric:"level",need:50,title:"Champion",desc:"Reach level 50",xp:20000,gold:6000},
  // Kill streak
  {id:"streak10",metric:"bestKillStreak",need:10,title:"Unstoppable",desc:"Reach a 10 kill streak",xp:800,gold:250},
  {id:"streak25",metric:"bestKillStreak",need:25,title:"Rampage",desc:"Reach a 25 kill streak",xp:5000,gold:1500},
  // Boss kills
  {id:"boss1",metric:"bossKills",need:1,title:"Giant Slayer",desc:"Defeat your first boss",xp:1000,gold:300},
  {id:"boss3",metric:"bossKills",need:3,title:"Third Time's the Charm",desc:"Defeat 3 bosses",xp:4000,gold:1000},
  {id:"boss5",metric:"bossKills",need:5,title:"Boss Breaker",desc:"Defeat 5 bosses",xp:9000,gold:2500},
  {id:"boss10",metric:"bossKills",need:10,title:"Bane of Guardians",desc:"Defeat 10 bosses",xp:25000,gold:8000},
  // Discovery milestones (v1.1)
  {id:"portal1",metric:"portalsFound",need:1,title:"Found the First Waypoint",desc:"Discover a secret passage — quick travel saves many steps!",xp:600,gold:200},
  {id:"emergency1",metric:"emergencyEscapes",need:1,title:"Always a Way Down",desc:"Trigger an emergency escape — you've discovered there is always a way to descend further",xp:600,gold:200}
];

function metricValue(metric){
  switch(metric){
    case"totalKills": return S.totalKills||0;
    case"goldEarned": return S.goldEarned||0;
    case"goldSpent": return S.goldSpent||0;
    case"cleanHouse": return S.cleanHouse||0;
    case"leprosyCount": return S.leprosyCount||0;
    case"maxPotionStack": {
      // Largest current potion stack in inventory (for Elixir Collector).
      let max=0;
      for(let it of (S.inventory||[])){ if(it.type==="potion") max=Math.max(max,it.count||1); }
      return max;
    }
    case"allFingersRinged": {
      // 1 when every INTACT finger slot holds a ring (lost fingers don't count).
      // Requires at least one intact slot AND a ring on the hand (not all lost).
      let lf=S.lostFingers||{left:[],right:[]};
      let rings=S.equipment&&S.equipment.rings?S.equipment.rings:[];
      let intact=0, ringed=0;
      for(let i=0;i<10;i++){
        let lost=(i<5)?lf.left.includes(i):lf.right.includes(i-5);
        if(lost) continue;
        intact++;
        if(rings[i]) ringed++;
      }
      return (intact>0 && ringed===intact) ? 1 : 0;
    }
    case"fullyEquipped": {
      // 1 when EVERY slot is filled: all 8 gear slots + all 10 ring fingers.
      // This is a TRUE completionist goal — since doctors can restore lost fingers
      // (and un-mangle hands), the player must restore any lost slots and fill them.
      // No exemptions: all 18 slots must hold an item.
      let eq=S.equipment; if(!eq) return 0;
      let lf=S.lostFingers||{left:[],right:[]};
      // Any lost finger means a slot is missing — must be restored first.
      if((lf.left&&lf.left.length)||(lf.right&&lf.right.length)) return 0;
      let gearSlots=["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"];
      for(let s of gearSlots){ if(!eq[s]) return 0; }
      let rings=eq.rings||[];
      for(let i=0;i<10;i++){ if(!rings[i]) return 0; }
      return 1;
    }
    case"fingersLostTotal": return S.fingersLostTotal||0;
    case"deepestFloor": return S.deepestFloor||S.floor||1;
    case"level": return S.level||1;
    case"bestKillStreak": return S.bestKillStreak||0;
    case"bossKills": return S.bossKills||0;
    case"portalsFound": return (S.portals||[]).length;
    case"emergencyEscapes": return S.emergencyEscapes||0;
    default: return 0;
  }
}

function checkAchievements(){
  if(!S.achievements) S.achievements=[];
  let floorScale=1+Math.pow(S.floor,1.2)*0.02;
  for(let a of ACHIEVEMENTS){
    if(S.achievements.includes(a.id)) continue;
    if(metricValue(a.metric)>=a.need){
      S.achievements.push(a.id);
      let xpBonus=Math.round(a.xp*floorScale);
      let goldBonus=Math.round(a.gold*floorScale);
      if(xpBonus>0) S.xp+=xpBonus;
      if(goldBonus>0){ S.gold=(S.gold||0)+goldBonus; S.goldEarned=(S.goldEarned||0)+goldBonus; }
      let reward=[];
      if(xpBonus>0) reward.push(`+${xpBonus} XP`);
      if(goldBonus>0) reward.push(`+${goldBonus} 💰`);
      msg(`🏆 ACHIEVEMENT: ${a.title} — ${a.desc}!${reward.length?` 🎁 ${reward.join(" · ")}`:""}`);
      if(typeof checkLevelUp==="function") checkLevelUp();
    }
  }
}
window.checkAchievements=checkAchievements;
