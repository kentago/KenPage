// --- TRADER SYSTEM ---
const traderNames=["Will Stonehand","Borin the Merchant","Durin the Collector","Kargan the Huntsman","Nori the Broker","Thrain Goldbarter","Gimli Coinkeeper","Farin Gemdealer"];
const traderTitles=["Master Trader","Wandering Merchant","Deep Market Keeper","Dungeon Peddler","Loot Collector","Treasure Broker"];

function spawnTrader(){
  let name=traderNames[Math.floor(Math.random()*traderNames.length)];
  let title=traderTitles[Math.floor(Math.random()*traderTitles.length)];
  // Generate 3-5 wares for sale (persistent per trader)
  let count=3+Math.floor(Math.random()*3);
  let wares=[];
  for(let i=0;i<count;i++){
    let item=makeItem(types[Math.floor(Math.random()*types.length)]);
    // Price = value of stats + rarity premium, marked up for buying
    let baseValue=(Object.values(item.stats).reduce((a,b)=>a+b,0))*2+(rar.indexOf(item.rarity)+1)*8;
    item.price=Math.max(5,Math.round(baseValue*(1.5+Math.random()*0.5))); // 1.5-2× markup
    wares.push(item);
  }
  return{name,title,wares};
}

function talkTrader(){
  if(S.hp<=0)return;
  let r=room();
  if(!r.trader)return;
  showTraderModal(r.trader);
}

function showTraderModal(trader){
  // Ensure wares exist (older saves may not have them)
  if(!trader.wares) trader.wares=[];

  let chaBonus=1+(S.stats.cha||1)*0.03; // CHA improves sell prices

  let sellSection=S.inventory.length?S.inventory.map((x,i)=>{
    let value=Math.max(1,Math.floor(((Object.values(x.stats).reduce((a,b)=>a+b,0))*2+(rar.indexOf(x.rarity)+1)*5)*chaBonus));
    return`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b>
      <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
      ${x.trait?`<div class="trait">⚡ ${x.trait}</div>`:""}
      <div class="small">${x.rarity} · ${x.depth}</div>
      <button onclick="sellItem(${i},${value})">💰 Sell for ${value}</button>
    </div>`;}).join(""):"<div class=small>Nothing to sell.</div>";

  let buySection=trader.wares.length?trader.wares.map((x,i)=>{
    let afford=(S.gold||0)>=x.price;
    return`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b>
      <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
      ${x.trait?`<div class="trait">⚡ ${x.trait}</div>`:""}
      <div class="small">${x.rarity} · ${x.depth}</div>
      <button onclick="buyItem(${i})" ${afford?"":"disabled"}>🛒 Buy for ${x.price}${afford?"":" (need gold)"}</button>
    </div>`;}).join(""):"<div class=small>Sold out.</div>";

  let html=`<div class="discard-overlay" id="traderModal">
    <div class="discard-box">
      <h3>💲 ${trader.name}, ${trader.title}</h3>
      <p>"Welcome! You have 💰 ${S.gold||0} gold."</p>
      <h4>🛒 For Sale</h4>
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
  // Remove price field before adding to inventory/equipment
  let purchased={...item}; delete purchased.price;
  r.trader.wares.splice(idx,1); // sold out of this one
  msg(`🛒 Bought ${purchased.name} for ${item.price} gold. ${obtain(purchased)}`);
  save();
  // Reopen if wares remain
  if(r.trader.wares.length>0) showTraderModal(r.trader);
  else render();
}
