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
  {id:"boss10",metric:"bossKills",need:10,title:"Bane of Guardians",desc:"Defeat 10 bosses",xp:25000,gold:8000}
];

function metricValue(metric){
  switch(metric){
    case"totalKills": return S.totalKills||0;
    case"goldEarned": return S.goldEarned||0;
    case"fingersLostTotal": return S.fingersLostTotal||0;
    case"deepestFloor": return S.deepestFloor||S.floor||1;
    case"level": return S.level||1;
    case"bestKillStreak": return S.bestKillStreak||0;
    case"bossKills": return S.bossKills||0;
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
