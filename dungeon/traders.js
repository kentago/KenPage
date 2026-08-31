// --- TRADER SYSTEM ---
const traderNames=["Will Stonehand","Borin the Merchant","Durin the Collector","Kargan the Huntsman","Nori the Broker","Thrain Goldbarter","Gimli Coinkeeper","Farin Gemdealer"];
const traderTitles=["Master Trader","Wandering Merchant","Deep Market Keeper","Dungeon Peddler","Loot Collector","Treasure Broker"];

function spawnTrader(){
  let name=traderNames[Math.floor(Math.random()*traderNames.length)];
  let title=traderTitles[Math.floor(Math.random()*traderTitles.length)];
  // Wares are generated LAZILY the first time the trader is opened, so they can
  // "peek" at the hero's actual power/economy at the moment of meeting. Once
  // generated they persist (no re-roll exploit on revisit). Buying out the ENTIRE
  // stock unlocks a paid restock (a fresh peek) — restocks counts how many times.
  return{name,title,wares:null,restocks:0};
}

// Peek at the hero: how strong is their gear, and how much gold do they hoard?
function peekHero(){
  let equipped=[];
  ["weapon","helmet","armor","boots","shoulders","trousers","cape","amulet"].forEach(k=>{
    if(S.equipment[k]) equipped.push(S.equipment[k]);
  });
  S.equipment.rings.forEach(x=>{if(x)equipped.push(x);});
  let sums=equipped.map(it=>statSum(it));
  let avgPower=sums.length?Math.round(sums.reduce((a,b)=>a+b,0)/sums.length):0;
  return{avgPower,gold:S.gold||0};
}

// Stat-sum of whatever the hero has in the slot this item would occupy
// (weakest ring for rings, since that's what you'd replace).
function equippedPowerForSlot(item){
  let s=slot(item);
  if(s==="rings"){
    let rings=S.equipment.rings.filter(x=>x);
    if(!rings.length) return 0;
    return Math.min(...rings.map(r=>statSum(r)));
  }
  return S.equipment[s]?statSum(S.equipment[s]):0;
}

// Raise an item's stats so its total roughly reaches targetPower (never lowers it).
function liftItemTowardPower(item,targetPower){
  let cur=statSum(item);
  if(cur>=targetPower||targetPower<=0) return;
  let scale=targetPower/Math.max(1,cur);
  for(let k in item.stats) item.stats[k]=Math.max(1,Math.round(item.stats[k]*scale));
}

// Price a ware from its stat value + rarity premium, marked up and greed-scaled.
function priceWare(item,greed){
  let baseValue=(Object.values(item.stats).reduce((a,b)=>a+b,0))*2.5+(rar.indexOf(item.rarity)+1)*12;
  item.price=Math.max(10,Math.round(baseValue*(1.4+Math.random()*0.5)*(greed||1)));
}

// Generate a trader's wares by PEEKING at the hero (called once, then persisted).
// - Wares scale to the hero's actual gear power (never fall behind late-game).
// - A lucky roll guarantees at least one ware that beats a currently-equipped item.
// - Prices are GREEDY: a richer hero is quoted higher markups.
function generateWares(trader){
  let hero=peekHero();
  let count=3+Math.floor(Math.random()*3);
  let wares=[];
  // Greed from hoarded gold: richer heroes are quoted higher prices, up to +80%
  // (log-scaled so it ramps gently and never explodes).
  let greed=1+Math.min(0.8,Math.log10(Math.max(10,hero.gold))/10*1.2);

  for(let i=0;i<count;i++){
    let item=makeShopItem();
    // PEEK-SCALING: lift floor-scaled wares toward the hero's average gear power
    // so shops stay relevant even when the hero out-levels normal loot.
    liftItemTowardPower(item,Math.round(hero.avgPower*(0.85+Math.random()*0.4)));
    priceWare(item,greed);
    wares.push(item);
  }

  // LUCKY ROLL: guarantee at least one ware is a genuine upgrade over something
  // the hero has equipped in that slot (Luck raises the chance).
  let luck=(typeof eff==="function")?(eff().luck||0):0;
  // Asymptotic (endless-friendly): base 35%, approaches 90% but never reaches it.
  let luckyChance=(typeof luckChance==="function")?luckChance(luck,0.35,50):Math.min(0.75,0.35+luck*0.03);
  if(Math.random()<luckyChance){
    let idx=Math.floor(Math.random()*wares.length);
    let w=wares[idx];
    let target=equippedPowerForSlot(w);
    if(statSum(w)<=target){
      liftItemTowardPower(w,Math.round(target*(1.12+Math.random()*0.25))); // 12-37% better
    }
    w.tradersPick=true;        // flag so the UI can highlight it
    priceWare(w,greed*1.15);   // the trader knows it's good — charges extra
  }
  trader.wares=wares;
}

// The cost to restock a trader's SOLD-OUT stock. This is a deliberate gold sink:
// it scales with the hero's hoarded gold (greedy) AND escalates each restock
// (1st cheap, each subsequent one ~1.6× the last) so repeat restocking drains
// wealth. A restock re-peeks the hero, so the fresh batch matches current power.
function restockFee(trader){
  let gold=S.gold||0;
  let base=Math.max(50,Math.round(gold*0.15));      // 15% of your purse (min 50)
  let escalation=Math.pow(1.6,trader.restocks||0);  // gets pricier every restock
  return Math.round(base*escalation);
}

// Pay the restock fee to generate a fresh, peeked batch of wares. Only valid
// when the trader is completely sold out (wares empty).
function restockTrader(){
  if(S.hp<=0) return;
  let r=room();
  if(!r.trader) return;
  let t=r.trader;
  if(t.wares&&t.wares.length>0) return; // only when fully bought out
  let fee=restockFee(t);
  if((S.gold||0)<fee){
    msg(`💲 A restock costs ${fee} gold — you only have ${S.gold||0}.`);
    return;
  }
  let modal=document.getElementById("traderModal");
  if(modal) modal.remove();
  S.gold-=fee;
  S.goldSpent=(S.goldSpent||0)+fee;
  t.restocks=(t.restocks||0)+1;
  t.wares=null;            // force a fresh peek
  generateWares(t);
  msg(`🔄 You pay ${fee} gold. ${t.name} eagerly lays out a fresh batch of goods! (Restock #${t.restocks} — the next one will cost more.)`);
  if(typeof checkAchievements==="function") checkAchievements();
  save();
  showTraderModal(t);
}

// Shop wares are premium: guaranteed 3 stats, always a trait, and a quality roll
// that can EXCEED normal loot — so buying stays worthwhile even late-game.
function makeShopItem(){
  let type=types[Math.floor(Math.random()*types.length)];
  // Start from a normal item but upgrade it
  let item=makeItem(type);
  // Quality boost: shop items roll 1.1-1.7× on stats (can beat found loot)
  let boost=1.1+Math.random()*0.6;
  let p=["str","dex","int","cha"];
  // Ensure at least 3 distinct stats
  let present=Object.keys(item.stats);
  for(let stat of p){
    if(present.length>=3) break;
    if(!item.stats[stat]){
      let base=Math.max(...Object.values(item.stats),1);
      item.stats[stat]=Math.max(1,Math.round(base*(0.2+Math.random()*0.4)));
      present=Object.keys(item.stats);
    }
  }
  // Apply the quality boost to all stats
  for(let k in item.stats) item.stats[k]=Math.max(1,Math.round(item.stats[k]*boost));
  // Guarantee a trait
  if(!item.trait){
    let pool=type==="ring"?ringTraits:type==="amulet"?amuletTraits:traits;
    item.trait=pool[Math.floor(Math.random()*pool.length)];
  }
  // Slight rarity bump if common
  if(item.rarity==="common"&&Math.random()<0.6) item.rarity="uncommon";
  return item;
}

function talkTrader(){
  if(S.hp<=0)return;
  let r=room();
  if(!r.trader)return;
  showTraderModal(r.trader);
}

function showTraderModal(trader){
  // First time this trader is opened, generate wares by peeking at the hero
  // (power + economy). Persisted afterward so revisits show the same goods.
  if(!trader.wares){
    generateWares(trader);
  }

  // Sell values come from itemValue() (which applies the CHA bonus, capped).
  let sellSection=S.inventory.length?S.inventory.map((x,i)=>{
    let value=itemValue(x);
    return`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b>
      <div class="item-type">${typeLabel(x.type)}</div>
      <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
      ${x.trait?`<div class="trait">⚡ ${x.trait}</div>`:""}
      <div class="small">${x.rarity} · ${x.depth}</div>
      <button onclick="sellItem(${i},${value})">💰 Sell for ${value}</button>
    </div>`;}).join(""):"<div class=small>Nothing to sell.</div>";

  let soldOut=!trader.wares.length;
  let restockBlock="";
  if(soldOut){
    let fee=restockFee(trader);
    let canAfford=(S.gold||0)>=fee;
    restockBlock=`<div class="restock-offer">
      <p><b>🧹 You bought out ${trader.name}'s entire stock!</b></p>
      <p class="restock-rules">A hero who clears the shelves is a hero worth staying for. Pay a <b>restock fee</b> and ${trader.name} lays out a <b>brand-new batch</b> of ${3}–${5} wares — freshly sized up to your <b>current gear</b> (so they're always relevant) with a chance at a ⭐ <b>Trader's Pick</b> upgrade. Each restock costs more than the last, and the fee grows with your wealth. Keep buying and this trader stays put, restocking as long as your gold lasts.</p>
      <button onclick="restockTrader()" ${canAfford?"":"disabled"}>🔄 Restock for ${fee} gold${canAfford?"":" (need gold)"}</button>
    </div>`;
  }

  let buySection=trader.wares.length?trader.wares.map((x,i)=>{
    let afford=(S.gold||0)>=x.price;
    return`<div class="item ${x.rarity} ${x.depth}${x.tradersPick?" traders-pick":""}"><span class="art">${x.art}</span><b>${x.tradersPick?`⭐ ${x.name} ⭐`:x.name}</b>
      <div class="item-type">${typeLabel(x.type)}</div>
      <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
      ${x.trait?`<div class="trait">⚡ ${x.trait}</div>`:""}
      <div class="small">${x.rarity} · ${x.depth}</div>
      ${compareLine(x,"shop")}
      <button onclick="buyItem(${i})" ${afford?"":"disabled"}>🛒 Buy for ${x.price}${afford?"":" (need gold)"}</button>
    </div>`;}).join(""):restockBlock;

  let html=`<div class="discard-overlay" id="traderModal">
    <div class="discard-box">
      <h3>💲 ${trader.name}, ${trader.title}</h3>
      <p>"${(S.gold||0)>=2000?"Ahh, a hero of <i>means</i>! For you, my finest goods — at a fitting price.":"Welcome, traveler!"} You have 💰 ${S.gold||0} gold."</p>
      <h4>🛒 For Sale${(trader.wares||[]).some(w=>w.tradersPick)?` <span class="pick-legend">— ⭐ = Trader's Pick (a guaranteed upgrade) ⭐</span>`:""}</h4>
      <div class="discard-list">${buySection}</div>
      <h4>💰 Sell Your Goods</h4>
      <div class="discard-list">${sellSection}</div>
      <button onclick="document.getElementById('traderModal').remove()">Done Trading</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend",html);
}

function sellItem(idx,value){
  let modal=document.getElementById("traderModal");
  if(modal)modal.remove();
  let item=S.inventory[idx];
  if(!item)return;
  S.inventory.splice(idx,1);
  S.gold=(S.gold||0)+value;
  msg(`💰 Sold ${item.name} for ${value} gold.`);
  save();
  // Reopen trader so player can keep trading
  let r=room();
  if(r.trader) showTraderModal(r.trader);
}

function buyItem(idx){
  let r=room();
  if(!r.trader||!r.trader.wares) return;
  let item=r.trader.wares[idx];
  if(!item) return;
  if((S.gold||0)<item.price){
    msg(`💲 Not enough gold. You need ${item.price}, have ${S.gold||0}.`);
    return;
  }
  let modal=document.getElementById("traderModal");
  if(modal)modal.remove();
  S.gold-=item.price;
  S.goldSpent=(S.goldSpent||0)+item.price;
  // Remove shop-only fields before adding to inventory/equipment
  let purchased={...item}; delete purchased.price; delete purchased.tradersPick;
  r.trader.wares.splice(idx,1); // sold out of this one
  msg(`🛒 Bought ${purchased.name} for ${item.price} gold. ${obtain(purchased)}`);
  // "Clean House" — bought out a trader's ENTIRE stock in one visit.
  if(r.trader.wares.length===0){
    S.cleanHouse=(S.cleanHouse||0)+1;
    msg(`🧹 You cleared out ${r.trader.name}'s entire stock!`);
  }
  if(typeof checkAchievements==="function") checkAchievements();
  save();
  // Reopen the modal either way: if wares remain, show them; if this was the
  // last ware, the modal now presents the clear "buy-out → restock" offer.
  showTraderModal(r.trader);
}
