// --- TRADER SYSTEM ---
const traderNames=["Will Stonehand","Borin the Merchant","Durin the Collector","Kargan the Huntsman","Nori the Broker","Thrain Goldbarter","Gimli Coinkeeper","Farin Gemdealer"];
const traderTitles=["Master Trader","Wandering Merchant","Deep Market Keeper","Dungeon Peddler","Loot Collector","Treasure Broker"];

function spawnTrader(){
  let name=traderNames[Math.floor(Math.random()*traderNames.length)];
  let title=traderTitles[Math.floor(Math.random()*traderTitles.length)];
  return{name,title};
}

function talkTrader(){
  if(S.hp<=0)return;
  let r=room();
  if(!r.trader)return;

  // Sell items for gold
  if(S.inventory.length===0){
    msg(`💲 ${r.trader.name}, ${r.trader.title}, says: "Nothing to trade? Come back when you have goods."`);
    return;
  }
  // Show sell interface
  showTraderModal(r.trader);
}

function showTraderModal(trader){
  let html=`<div class="discard-overlay" id="traderModal">
    <div class="discard-box">
      <h3>💲 ${trader.name}, ${trader.title}</h3>
      <p>"Show me what you've got. I'll pay fair gold."</p>
      <div class="discard-list">${S.inventory.map((x,i)=>{
        let chaBonus=1+(S.stats.cha||1)*0.03; // +3% price per CHA point
        let value=Math.max(1,Math.floor(((Object.values(x.stats).reduce((a,b)=>a+b,0))*2+(rar.indexOf(x.rarity)+1)*5)*chaBonus));
        return`<div class="item ${x.rarity} ${x.depth}"><span class="art">${x.art}</span><b>${x.name}</b>
        <div>${Object.entries(x.stats).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(" · ")}</div>
        <div class="small">${x.rarity} · ${x.depth}</div>
        <button onclick="sellItem(${i},${value})">💰 Sell for ${value} gold</button>
      </div>`;}).join("")}</div>
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
  S.gold+=value;
  msg(`💰 Sold ${item.name} for ${value} gold.`);
  save();render();
}
