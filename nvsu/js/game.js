// Narwhals vs Unicorns — V1
// Two pods of three, hotseat turns, destructible terrain.

const CANVAS_W = 960;
const CANVAS_H = 540;
const GRAVITY = 0.22;
const MOVE_SPEED = 2.3;
const HORN_RADIUS = 16;
const WATER_LEVEL = CANVAS_H - 34;
const TURN_SECONDS = 30;
const WIND_FACTOR = 0.012;
const POD_SIZE = 3;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayBtn = document.getElementById('overlay-btn');
const highscoreLine = document.getElementById('highscore-line');
const p1WinsEl = document.getElementById('p1wins');
const p2WinsEl = document.getElementById('p2wins');

let terrain;
let sides; // [p1 pod, p2 pod]
let activeIndex = 0;
let turnTimeLeft = TURN_SECONDS;
let wind = 0;
let projectiles = [];
let particles = [];
let floatingTexts = [];
let phase = 'menu'; // menu | aiming | resolving | gameover
let lastTime = 0;
let stats = loadStats();
let pendingSpawns = 0; // guards against ending a turn mid-airstrike

function makeCombatant(name, x, facing) {
  return {
    name,
    x, y: 0,
    vx: 0, vy: 0,
    health: 100,
    alive: true,
    aimAngle: 25,
    facing,
  };
}

function makeSide(key, color, teamLabel, names, baseXs) {
  const roster = names.map((n, i) => makeCombatant(n, baseXs[i], key === 'p1' ? 1 : -1));
  return {
    key, color, teamLabel,
    roster,
    activeUnitIndex: 0,
    power: 0,
    charging: false,
    selectedWeapon: 'bazooka',
    ammo: defaultAmmoSet(),
  };
}

function allCombatants() {
  return sides.flatMap(s => s.roster);
}

function currentSide() { return sides[activeIndex]; }
function otherSide() { return sides[1 - activeIndex]; }
function currentUnit() { return currentSide().roster[currentSide().activeUnitIndex]; }

function aliveIndices(side) {
  const out = [];
  side.roster.forEach((u, i) => { if (u.alive) out.push(i); });
  return out;
}

function ensureAliveActive(side) {
  if (side.roster[side.activeUnitIndex] && side.roster[side.activeUnitIndex].alive) return;
  const alive = aliveIndices(side);
  if (alive.length) side.activeUnitIndex = alive[0];
}

function switchUnit(side) {
  const alive = aliveIndices(side);
  if (alive.length < 2) return;
  const pos = alive.indexOf(side.activeUnitIndex);
  side.activeUnitIndex = alive[(pos + 1) % alive.length];
}

function resetMatch() {
  terrain = new Terrain(CANVAS_W, CANVAS_H, WATER_LEVEL);

  const p1Xs = [0.10, 0.20, 0.30].map(f => CANVAS_W * f);
  const p2Xs = [0.70, 0.80, 0.90].map(f => CANVAS_W * f);
  const p1Names = generatePodNames(NARWHAL_FIRST_NAMES, NARWHAL_SURNAMES, POD_SIZE);
  const p2Names = generatePodNames(UNICORN_FIRST_NAMES, UNICORN_SURNAMES, POD_SIZE);

  const p1 = makeSide('p1', '#5ec8ff', 'Narwhal Pod', p1Names, p1Xs);
  const p2 = makeSide('p2', '#ff9ad5', 'Unicorn Pod', p2Names, p2Xs);

  for (const u of p1.roster) u.y = terrain.surfaceYAt(u.x) - HORN_RADIUS;
  for (const u of p2.roster) u.y = terrain.surfaceYAt(u.x) - HORN_RADIUS;

  sides = [p1, p2];
  activeIndex = Math.random() < 0.5 ? 0 : 1;
  turnTimeLeft = TURN_SECONDS;
  wind = (Math.random() * 2 - 1);
  projectiles = [];
  particles = [];
  floatingTexts = [];
  phase = 'aiming';
  refreshHUD();
}

// ---------- Input ----------
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(e.key)) e.preventDefault();
  if (!keys.has(e.key)) {
    keys.add(e.key);
    handleKeyDown(e.key);
  }
});
window.addEventListener('keyup', (e) => {
  keys.delete(e.key);
  handleKeyUp(e.key);
});

function handleKeyDown(key) {
  if (phase !== 'aiming') return;
  const side = currentSide();
  const fireKey = side.key === 'p1' ? ' ' : 'Enter';
  if (key === fireKey) startCharging(side);
  if (key === 'Tab') switchUnit(side);
}

function handleKeyUp(key) {
  if (phase !== 'aiming') return;
  const side = currentSide();
  const fireKey = side.key === 'p1' ? ' ' : 'Enter';
  if (key === fireKey) releaseFire(side);
}

function startCharging(side) {
  const w = getWeapon(side.selectedWeapon);
  if (side.ammo[w.id] <= 0) return;
  if (w.type === 'hitscan' || w.type === 'airstrike') {
    fireWeapon(side); // instant, no charge
  } else if (w.charge) {
    side.charging = true;
    side.power = 0;
  }
}

function releaseFire(side) {
  if (!side.charging) return;
  side.charging = false;
  fireWeapon(side);
}

// ---------- Weapon panels & roster (DOM) ----------
function buildWeaponPanel(containerId, sideIndex) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  WEAPONS.forEach(w => {
    const btn = document.createElement('button');
    btn.className = 'wbtn';
    btn.dataset.weapon = w.id;
    btn.addEventListener('click', () => {
      sides[sideIndex].selectedWeapon = w.id;
      refreshHUD();
    });
    container.appendChild(btn);
  });
}

function refreshHUD() {
  if (!sides) return;
  [['p1weapons', 0], ['p2weapons', 1]].forEach(([id, idx]) => {
    const side = sides[idx];
    const container = document.getElementById(id);
    [...container.children].forEach(btn => {
      const w = getWeapon(btn.dataset.weapon);
      const ammoLeft = side.ammo[w.id];
      const ammoText = ammoLeft === Infinity ? '∞' : ammoLeft;
      btn.innerHTML = `<b>${w.icon} ${w.name}</b>x${ammoText}`;
      btn.classList.toggle('active', side.selectedWeapon === w.id);
      btn.disabled = ammoLeft <= 0;
    });
  });

  [['p1roster', 0], ['p2roster', 1]].forEach(([id, idx]) => {
    const side = sides[idx];
    const list = document.getElementById(id);
    list.innerHTML = '';
    side.roster.forEach((u, i) => {
      const li = document.createElement('li');
      if (!u.alive) li.classList.add('fallen');
      else if (i === side.activeUnitIndex) li.classList.add('active');
      li.innerHTML = `<span>${u.name}</span><span>${u.alive ? u.health : '💀'}</span>`;
      list.appendChild(li);
    });
  });

  p1WinsEl.textContent = `— ${stats.p1Wins} win${stats.p1Wins === 1 ? '' : 's'}`;
  p2WinsEl.textContent = `— ${stats.p2Wins} win${stats.p2Wins === 1 ? '' : 's'}`;
}

document.getElementById('p1switch').addEventListener('click', () => { switchUnit(sides[0]); refreshHUD(); });
document.getElementById('p2switch').addEventListener('click', () => { switchUnit(sides[1]); refreshHUD(); });

// ---------- Firing ----------
function muzzlePosition(u) {
  const rad = (u.aimAngle * Math.PI) / 180;
  const effAngle = u.facing === 1 ? rad : Math.PI - rad;
  const mx = u.x + Math.cos(effAngle) * (HORN_RADIUS + 12);
  const my = u.y - Math.sin(effAngle) * (HORN_RADIUS + 12);
  return { x: mx, y: my, effAngle };
}

function fireWeapon(side) {
  const w = getWeapon(side.selectedWeapon);
  if (side.ammo[w.id] <= 0) return;
  if (w.ammo !== Infinity) side.ammo[w.id] -= 1;
  const u = side.roster[side.activeUnitIndex];
  const { x, y, effAngle } = muzzlePosition(u);

  if (w.type === 'projectile' || w.type === 'grenade') {
    const speed = w.minSpeed + (w.maxSpeed - w.minSpeed) * (side.power / 100);
    projectiles.push({
      type: w.type,
      ownerKey: side.key,
      weapon: w,
      x, y,
      vx: Math.cos(effAngle) * speed,
      vy: -Math.sin(effAngle) * speed,
      fuse: w.fuse || 0,
      born: performance.now(),
    });
    phase = 'resolving';
  } else if (w.type === 'hitscan') {
    doHitscan(side, u, w, x, y, effAngle);
    phase = 'resolving';
  } else if (w.type === 'airstrike') {
    doAirstrike(side, w);
    phase = 'resolving';
  } else if (w.type === 'teleport') {
    doTeleport(u, w, effAngle, side);
    phase = 'resolving';
  }
  refreshHUD();
}

function doHitscan(side, shooter, w, startX, startY, baseAngle) {
  const targets = otherSide().roster.filter(t => t.alive);
  for (let i = 0; i < w.pellets; i++) {
    const spread = (Math.random() * 2 - 1) * w.spread;
    const angle = baseAngle + spread;
    const dx = Math.cos(angle);
    const dy = -Math.sin(angle);
    let hx = startX, hy = startY;
    let hit = false;
    for (let d = 0; d < w.range; d += 6) {
      hx = startX + dx * d;
      hy = startY + dy * d;
      if (terrain.isSolid(hx, hy)) { hit = true; break; }
      if (targets.some(t => Math.hypot(hx - t.x, hy - t.y) < HORN_RADIUS)) { hit = true; break; }
      if (hx < 0 || hx > CANVAS_W || hy < 0 || hy > CANVAS_H) break;
    }
    if (hit) explode(hx, hy, w.radius, w.damage);
    else spawnTracer(startX, startY, hx, hy);
  }
}

function doAirstrike(side, w) {
  const aliveTargets = otherSide().roster.filter(t => t.alive);
  const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
  const targetX = target.x + (Math.random() * 60 - 30);
  pendingSpawns += w.count;
  for (let i = 0; i < w.count; i++) {
    setTimeout(() => {
      pendingSpawns = Math.max(0, pendingSpawns - 1);
      if (phase === 'gameover') return;
      projectiles.push({
        type: 'projectile',
        ownerKey: side.key,
        weapon: w,
        x: targetX + (Math.random() * 50 - 25),
        y: -10,
        vx: (Math.random() * 1 - 0.5),
        vy: 4,
        born: performance.now(),
      });
    }, i * 220);
  }
}

function doTeleport(u, w, effAngle, side) {
  const dist = w.minDist + (w.maxDist - w.minDist) * (side.power / 100);
  let tx = u.x + Math.cos(effAngle) * dist;
  let ty = u.y - Math.sin(effAngle) * dist;
  tx = Math.max(HORN_RADIUS, Math.min(CANVAS_W - HORN_RADIUS, tx));
  ty = Math.max(HORN_RADIUS, Math.min(CANVAS_H - HORN_RADIUS, ty));
  let tries = 0;
  while (terrain.isSolid(tx, ty) && tries < 60) { ty -= 3; tries++; }
  u.x = tx; u.y = ty; u.vx = 0; u.vy = 0;
}

// ---------- Explosions & effects ----------
function explode(x, y, radius, damage) {
  terrain.carve(x, y, radius);
  spawnBlast(x, y, radius);
  for (const u of allCombatants()) {
    if (!u.alive) continue;
    const dist = Math.hypot(u.x - x, u.y - y);
    const falloff = radius + HORN_RADIUS;
    if (dist < falloff) {
      const dmg = Math.round(damage * (1 - dist / falloff));
      u.health = Math.max(0, u.health - dmg);
      const ang = Math.atan2(u.y - y, u.x - x) || 0;
      const force = (1 - dist / falloff) * 10;
      u.vx += Math.cos(ang) * force;
      u.vy += Math.sin(ang) * force - 3;
      u.onGround = false;
      if (dmg > 0) floatingTexts.push({ x: u.x, y: u.y - 30, text: `-${dmg}`, life: 60 });
    }
  }
}

function spawnBlast(x, y, radius) {
  particles.push({ x, y, r: 4, maxR: radius * 1.1, life: 18, kind: 'blast' });
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: 2 + Math.random() * 2, life: 30 + Math.random() * 20, kind: 'debris',
    });
  }
}

function spawnTracer(x1, y1, x2, y2) {
  particles.push({ x: x1, y: y1, x2, y2, life: 8, kind: 'tracer' });
}

// ---------- Physics / update ----------
function updatePhysics(dt) {
  // Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const pr = projectiles[i];
    const w = pr.weapon;
    if (w.gravity !== false) pr.vy += GRAVITY;
    if (w.wind) pr.vx += wind * WIND_FACTOR;
    pr.x += pr.vx;
    pr.y += pr.vy;

    let outOfBounds = false;
    if (pr.x < -20 || pr.x > CANVAS_W + 20 || pr.y > CANVAS_H + 40) outOfBounds = true;

    const hitTerrain = !outOfBounds && terrain.isSolid(pr.x, pr.y);
    let hitUnit = null;
    if (!outOfBounds) {
      for (const u of allCombatants()) {
        if (u.alive && Math.hypot(u.x - pr.x, u.y - pr.y) < HORN_RADIUS) { hitUnit = u; break; }
      }
    }

    if (pr.type === 'grenade') {
      pr.fuse -= dt;
      if (hitTerrain || hitUnit) {
        pr.y -= pr.vy;
        pr.vy *= -w.bounce;
        pr.vx *= 0.7;
      }
      if (outOfBounds) { projectiles.splice(i, 1); continue; }
      if (pr.fuse <= 0) {
        explode(pr.x, pr.y, w.radius, w.damage);
        projectiles.splice(i, 1);
        continue;
      }
    } else {
      if (hitTerrain || hitUnit) {
        explode(pr.x, pr.y, w.radius, w.damage);
        projectiles.splice(i, 1);
        continue;
      }
      if (outOfBounds) { projectiles.splice(i, 1); continue; }
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life -= 1;
    if (pt.kind === 'debris') {
      pt.vy += GRAVITY * 0.5;
      pt.x += pt.vx;
      pt.y += pt.vy;
    }
    if (pt.life <= 0) particles.splice(i, 1);
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].y -= 0.4;
    floatingTexts[i].life -= 1;
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
  }

  // Combatants: gravity, ground snap, fall-into-water KO
  for (const u of allCombatants()) {
    if (!u.alive) continue;
    if (!terrain.isSolid(u.x, u.y + HORN_RADIUS + 1)) {
      u.vy += GRAVITY;
      u.onGround = false;
    } else {
      u.vy = 0;
      u.onGround = true;
    }
    u.x += u.vx;
    u.y += u.vy;
    u.vx *= 0.9;

    let guard = 0;
    while (terrain.isSolid(u.x, u.y) && guard < 40) { u.y -= 2; guard++; }

    u.x = Math.max(HORN_RADIUS, Math.min(CANVAS_W - HORN_RADIUS, u.x));

    if (u.y > WATER_LEVEL || u.health <= 0) {
      if (u.alive) {
        u.alive = false;
        u.health = 0;
      }
    }
  }

  const side = currentSide();
  if (side && side.charging) {
    side.power = Math.min(100, side.power + 1.6);
  }

  checkGameOver();

  if (phase === 'resolving' && pendingSpawns === 0 && projectiles.length === 0 && particles.length === 0) {
    const settled = allCombatants().every(u => !u.alive || u.onGround);
    if (settled) endTurn();
  }
}

function checkGameOver() {
  if (phase === 'gameover') return;
  for (const side of sides) {
    if (side.roster.every(u => !u.alive)) {
      phase = 'gameover';
      const winner = sides.find(s => s !== side);
      const updated = recordWin(winner.key);
      stats = updated;
      showGameOver(winner);
      return;
    }
  }
}

function endTurn() {
  activeIndex = 1 - activeIndex;
  turnTimeLeft = TURN_SECONDS;
  wind = Math.max(-1, Math.min(1, wind + (Math.random() * 0.6 - 0.3)));
  const side = currentSide();
  ensureAliveActive(side);
  side.power = 0;
  side.charging = false;
  phase = 'aiming';
  refreshHUD();
}

function tickInputMovement() {
  if (phase !== 'aiming') return;
  const side = currentSide();
  const u = currentUnit();
  if (!u) return;
  const left = side.key === 'p1' ? 'a' : 'ArrowLeft';
  const right = side.key === 'p1' ? 'd' : 'ArrowRight';
  const up = side.key === 'p1' ? 'w' : 'ArrowUp';
  const down = side.key === 'p1' ? 's' : 'ArrowDown';

  if (keys.has(left)) { tryMove(u, -MOVE_SPEED); u.facing = -1; }
  if (keys.has(right)) { tryMove(u, MOVE_SPEED); u.facing = 1; }
  if (keys.has(up)) u.aimAngle = Math.min(85, u.aimAngle + 1.6);
  if (keys.has(down)) u.aimAngle = Math.max(-40, u.aimAngle - 1.6);
}

function tryMove(u, dx) {
  const steps = [0, -6, -12];
  for (const s of steps) {
    const testY = u.y + s;
    if (!terrain.isSolid(u.x + dx, testY) && !terrain.isSolid(u.x + dx, testY + HORN_RADIUS)) {
      u.x += dx;
      if (s < 0) u.y = testY;
      u.x = Math.max(HORN_RADIUS, Math.min(CANVAS_W - HORN_RADIUS, u.x));
      return;
    }
  }
}

// ---------- Touch / on-screen controls ----------
// One shared pad, since the device gets passed between turns — it always
// drives whoever's turn it currently is, rather than having a fixed side.
function activeKeyFor(dir) {
  const side = currentSide();
  const map = side.key === 'p1'
    ? { left: 'a', right: 'd', up: 'w', down: 's' }
    : { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  return map[dir];
}

function bindHold(el, onDown, onUp) {
  let active = false;
  const start = (e) => {
    e.preventDefault();
    if (active) return;
    active = true;
    onDown();
  };
  const end = (e) => {
    e.preventDefault();
    if (!active) return;
    active = false;
    onUp();
  };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', end);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

function bindDirectionButton(el, dir) {
  let heldKey = null;
  bindHold(
    el,
    () => { heldKey = activeKeyFor(dir); keys.add(heldKey); },
    () => { if (heldKey) keys.delete(heldKey); heldKey = null; }
  );
}

function setupTouchControls() {
  bindDirectionButton(document.getElementById('tp-left'), 'left');
  bindDirectionButton(document.getElementById('tp-right'), 'right');
  bindDirectionButton(document.getElementById('tp-up'), 'up');
  bindDirectionButton(document.getElementById('tp-down'), 'down');
  document.getElementById('tp-switch').addEventListener('click', () => {
    if (phase === 'aiming') { switchUnit(currentSide()); refreshHUD(); }
  });
  bindHold(
    document.getElementById('tp-fire'),
    () => { if (phase === 'aiming') startCharging(currentSide()); },
    () => { if (phase === 'aiming') releaseFire(currentSide()); }
  );
}

// ---------- Turn timer ----------
function tickTimer(dt) {
  if (phase !== 'aiming') return;
  turnTimeLeft -= dt / 1000;
  if (turnTimeLeft <= 0) {
    turnTimeLeft = 0;
    const side = currentSide();
    side.charging = false;
    side.power = 0;
    phase = 'resolving';
  }
}

// ---------- Rendering ----------
function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#bfe9ff');
  sky.addColorStop(1, '#eaf7ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const waterGrad = ctx.createLinearGradient(0, WATER_LEVEL, 0, CANVAS_H);
  waterGrad.addColorStop(0, '#3aa9d8');
  waterGrad.addColorStop(1, '#1c5f85');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, WATER_LEVEL, CANVAS_W, CANVAS_H - WATER_LEVEL);

  terrain.draw(ctx);

  for (const side of sides) {
    for (const u of side.roster) drawCombatant(u, side);
  }

  for (const pr of projectiles) {
    ctx.fillStyle = pr.type === 'grenade' ? '#8a6bff' : '#ffcf4d';
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.type === 'grenade' ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const pt of particles) {
    if (pt.kind === 'blast') {
      const t = 1 - pt.life / 18;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#ffddaa';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.maxR * t, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (pt.kind === 'debris') {
      ctx.fillStyle = '#6b4a2f';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (pt.kind === 'tracer') {
      ctx.strokeStyle = 'rgba(255,240,180,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x2, pt.y2);
      ctx.stroke();
    }
  }

  for (const ft of floatingTexts) {
    ctx.globalAlpha = Math.min(1, ft.life / 30);
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1;
  }

  drawHUD();
}

function drawCombatant(u, side) {
  if (!u.alive) return;
  const isActive = phase === 'aiming' && currentSide() === side && currentUnit() === u;

  ctx.save();
  ctx.translate(u.x, u.y);

  ctx.fillStyle = side.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, HORN_RADIUS, HORN_RADIUS * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isActive) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, HORN_RADIUS + 3, HORN_RADIUS * 0.85 + 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The horn doubles as the aiming cannon — it rotates to the unit's
  // stored aim angle and grows slightly (with a color shift) while
  // charging a shot, instead of a separate floating indicator line.
  const rad = (u.aimAngle * Math.PI) / 180;
  const effAngle = u.facing === 1 ? rad : Math.PI - rad;
  const charging = isActive && side.charging;
  const baseDist = HORN_RADIUS * 0.85;
  const hornLen = 20 + (charging ? side.power * 0.28 : 0);
  const hornHalfWidth = 3.5;

  const bx = Math.cos(effAngle) * baseDist;
  const by = -Math.sin(effAngle) * baseDist;
  const tx = Math.cos(effAngle) * (baseDist + hornLen);
  const ty = -Math.sin(effAngle) * (baseDist + hornLen);
  const perp = effAngle + Math.PI / 2;
  const wx = Math.cos(perp) * hornHalfWidth;
  const wy = -Math.sin(perp) * hornHalfWidth;

  ctx.fillStyle = charging ? '#ffb703' : '#fff2b8';
  ctx.beginPath();
  ctx.moveTo(bx + wx, by + wy);
  ctx.lineTo(bx - wx, by - wy);
  ctx.lineTo(tx, ty);
  ctx.closePath();
  ctx.fill();
  if (isActive) {
    ctx.strokeStyle = charging ? '#ff8800' : 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = '#101025';
  ctx.beginPath();
  ctx.arc(u.facing * 5, -3, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#101025';
  ctx.fillText(u.name, u.x, u.y - HORN_RADIUS - 20);
  const barW = 34;
  ctx.fillStyle = '#00000033';
  ctx.fillRect(u.x - barW / 2, u.y - HORN_RADIUS - 14, barW, 5);
  ctx.fillStyle = u.health > 40 ? '#4caf50' : '#e53935';
  ctx.fillRect(u.x - barW / 2, u.y - HORN_RADIUS - 14, barW * (u.health / 100), 5);
}

function drawHUD() {
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  const side = currentSide();
  const u = currentUnit();
  if (side && u) {
    ctx.fillStyle = side.key === 'p1' ? '#2b6fa3' : '#a3306f';
    ctx.fillText(`${u.name} (${side.teamLabel}) — ${getWeapon(side.selectedWeapon).name}`, 12, 22);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = turnTimeLeft < 6 ? '#e53935' : '#333';
  ctx.fillText(`${Math.ceil(turnTimeLeft)}s`, CANVAS_W - 12, 22);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#333';
  ctx.fillText('WIND', CANVAS_W / 2, 16);
  ctx.save();
  ctx.translate(CANVAS_W / 2, 30);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(30, 0);
  ctx.stroke();
  const arrowX = wind * 30;
  ctx.beginPath();
  ctx.arc(arrowX, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = wind === 0 ? '#333' : (wind > 0 ? '#e07b00' : '#0077e0');
  ctx.fill();
  ctx.restore();

  if (side && side.charging) {
    ctx.fillStyle = '#00000033';
    ctx.fillRect(CANVAS_W / 2 - 60, CANVAS_H - 24, 120, 10);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(CANVAS_W / 2 - 60, CANVAS_H - 24, 120 * (side.power / 100), 10);
  }

  ctx.textAlign = 'left';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(20,20,40,0.55)';
  ctx.fillText(`Map: ${MAP_STYLE_LABELS[terrain.mapStyle]}`, 12, CANVAS_H - 10);
}

// ---------- Game over ----------
function showGameOver(winner) {
  overlayTitle.textContent = `${winner.teamLabel} wins!`;
  overlayText.textContent = winner.key === 'p1'
    ? 'The narwhals reign supreme. Horns up.'
    : 'The unicorns take the battlefield. Magic beats blubber.';
  overlayBtn.textContent = 'Play Again';
  highscoreLine.textContent = `Score so far — Narwhals: ${stats.p1Wins} · Unicorns: ${stats.p2Wins}`;
  overlay.classList.remove('hidden');
}

overlayBtn.addEventListener('click', () => {
  overlay.classList.add('hidden');
  resetMatch();
});

// ---------- Main loop ----------
function loop(ts) {
  const dt = lastTime ? Math.min(50, ts - lastTime) : 16;
  lastTime = ts;

  if (phase === 'aiming' || phase === 'resolving') {
    tickInputMovement();
    tickTimer(dt);
    updatePhysics(dt);
  }
  render();
  requestAnimationFrame(loop);
}

// ---------- Init ----------
function init() {
  stats = loadStats();
  highscoreLine.textContent = `Score so far — Narwhals: ${stats.p1Wins} · Unicorns: ${stats.p2Wins}`;
  resetMatch();
  buildWeaponPanel('p1weapons', 0);
  buildWeaponPanel('p2weapons', 1);
  setupTouchControls();
  refreshHUD();
  phase = 'menu';
  requestAnimationFrame(loop);
}

overlayTitle.textContent = 'Narwhals vs Unicorns';
init();
