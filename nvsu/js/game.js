// Narwhals vs Unicorns — V1
// Local 2-player hotseat, turn-based, destructible terrain.

const CANVAS_W = 960;
const CANVAS_H = 540;
const GRAVITY = 0.22;
const MOVE_SPEED = 2.3;
const HORN_RADIUS = 16;
const WATER_LEVEL = CANVAS_H - 34;
const TURN_SECONDS = 30;
const WIND_FACTOR = 0.012;

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
let players; // [p1, p2]
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

function makePlayer(key, name, color, x, facing) {
  return {
    key, name, color, facing,
    x, y: 0,
    vx: 0, vy: 0,
    health: 100,
    alive: true,
    aimAngle: 25, // degrees, tilt above horizontal
    power: 0,
    charging: false,
    selectedWeapon: 'bazooka',
    ammo: defaultAmmoSet(),
    onGround: false,
  };
}

function resetMatch() {
  terrain = new Terrain(CANVAS_W, CANVAS_H, WATER_LEVEL);
  const p1 = makePlayer('p1', 'Narwhal', '#5ec8ff', CANVAS_W * 0.22, 1);
  const p2 = makePlayer('p2', 'Unicorn', '#ff9ad5', CANVAS_W * 0.78, -1);
  p1.y = terrain.surfaceYAt(p1.x) - HORN_RADIUS;
  p2.y = terrain.surfaceYAt(p2.x) - HORN_RADIUS;
  players = [p1, p2];
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
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if (!keys.has(e.key)) {
    keys.add(e.key);
    handleKeyDown(e.key);
  }
});
window.addEventListener('keyup', (e) => {
  keys.delete(e.key);
  handleKeyUp(e.key);
});

function currentPlayer() { return players[activeIndex]; }
function otherPlayer() { return players[1 - activeIndex]; }

function handleKeyDown(key) {
  if (phase !== 'aiming') return;
  const p = currentPlayer();
  const fireKey = p.key === 'p1' ? ' ' : 'Enter';
  if (key === fireKey) startCharging(p);
}

function handleKeyUp(key) {
  if (phase !== 'aiming') return;
  const p = currentPlayer();
  const fireKey = p.key === 'p1' ? ' ' : 'Enter';
  if (key === fireKey) releaseFire(p);
}

function startCharging(p) {
  const w = getWeapon(p.selectedWeapon);
  if (p.ammo[w.id] <= 0) return;
  if (w.type === 'hitscan' || w.type === 'airstrike') {
    fireWeapon(p); // instant, no charge
  } else if (w.charge) {
    p.charging = true;
    p.power = 0;
  }
}

function releaseFire(p) {
  if (!p.charging) return;
  p.charging = false;
  fireWeapon(p);
}

// ---------- Weapon panels (DOM) ----------
function buildWeaponPanel(containerId, playerIndex) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  WEAPONS.forEach(w => {
    const btn = document.createElement('button');
    btn.className = 'wbtn';
    btn.dataset.weapon = w.id;
    btn.addEventListener('click', () => {
      players[playerIndex].selectedWeapon = w.id;
      refreshHUD();
    });
    container.appendChild(btn);
  });
}

function refreshHUD() {
  if (!players) return;
  [['p1weapons', players[0]], ['p2weapons', players[1]]].forEach(([id, player]) => {
    const container = document.getElementById(id);
    [...container.children].forEach(btn => {
      const w = getWeapon(btn.dataset.weapon);
      const ammoLeft = player.ammo[w.id];
      const ammoText = ammoLeft === Infinity ? '∞' : ammoLeft;
      btn.innerHTML = `<b>${w.icon} ${w.name}</b>x${ammoText}`;
      btn.classList.toggle('active', player.selectedWeapon === w.id);
      btn.disabled = ammoLeft <= 0;
    });
  });
  p1WinsEl.textContent = `— ${stats.p1Wins} win${stats.p1Wins === 1 ? '' : 's'}`;
  p2WinsEl.textContent = `— ${stats.p2Wins} win${stats.p2Wins === 1 ? '' : 's'}`;
}

// ---------- Firing ----------
function muzzlePosition(p) {
  const rad = (p.aimAngle * Math.PI) / 180;
  const effAngle = p.facing === 1 ? rad : Math.PI - rad;
  const mx = p.x + Math.cos(effAngle) * (HORN_RADIUS + 12);
  const my = p.y - Math.sin(effAngle) * (HORN_RADIUS + 12);
  return { x: mx, y: my, effAngle };
}

function fireWeapon(p) {
  const w = getWeapon(p.selectedWeapon);
  if (p.ammo[w.id] <= 0) return;
  if (w.ammo !== Infinity) p.ammo[w.id] -= 1;
  const { x, y, effAngle } = muzzlePosition(p);

  if (w.type === 'projectile' || w.type === 'grenade') {
    const speed = w.minSpeed + (w.maxSpeed - w.minSpeed) * (p.power / 100);
    projectiles.push({
      type: w.type,
      ownerKey: p.key,
      weapon: w,
      x, y,
      vx: Math.cos(effAngle) * speed,
      vy: -Math.sin(effAngle) * speed,
      fuse: w.fuse || 0,
      born: performance.now(),
    });
    phase = 'resolving';
  } else if (w.type === 'hitscan') {
    doHitscan(p, w, x, y, effAngle);
    phase = 'resolving';
  } else if (w.type === 'airstrike') {
    doAirstrike(p, w);
    phase = 'resolving';
  } else if (w.type === 'teleport') {
    doTeleport(p, w, effAngle);
    phase = 'resolving';
  }
  refreshHUD();
}

function doHitscan(p, w, startX, startY, baseAngle) {
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
      const target = otherPlayer();
      if (Math.hypot(hx - target.x, hy - target.y) < HORN_RADIUS) { hit = true; break; }
      if (hx < 0 || hx > CANVAS_W || hy < 0 || hy > CANVAS_H) break;
    }
    if (hit) explode(hx, hy, w.radius, w.damage);
    else spawnTracer(startX, startY, hx, hy);
  }
}

function doAirstrike(p, w) {
  const targetX = otherPlayer().x + (Math.random() * 60 - 30);
  pendingSpawns += w.count;
  for (let i = 0; i < w.count; i++) {
    setTimeout(() => {
      pendingSpawns = Math.max(0, pendingSpawns - 1);
      if (phase === 'gameover') return;
      projectiles.push({
        type: 'projectile',
        ownerKey: p.key,
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

function doTeleport(p, w, effAngle) {
  const dist = w.minDist + (w.maxDist - w.minDist) * (p.power / 100);
  let tx = p.x + Math.cos(effAngle) * dist;
  let ty = p.y - Math.sin(effAngle) * dist;
  tx = Math.max(HORN_RADIUS, Math.min(CANVAS_W - HORN_RADIUS, tx));
  ty = Math.max(HORN_RADIUS, Math.min(CANVAS_H - HORN_RADIUS, ty));
  // push upward out of solid ground if needed
  let tries = 0;
  while (terrain.isSolid(tx, ty) && tries < 60) { ty -= 3; tries++; }
  p.x = tx; p.y = ty; p.vx = 0; p.vy = 0;
}

// ---------- Explosions & effects ----------
function explode(x, y, radius, damage) {
  terrain.carve(x, y, radius);
  spawnBlast(x, y, radius);
  for (const w of players) {
    if (!w.alive) continue;
    const dist = Math.hypot(w.x - x, w.y - y);
    const falloff = radius + HORN_RADIUS;
    if (dist < falloff) {
      const dmg = Math.round(damage * (1 - dist / falloff));
      w.health = Math.max(0, w.health - dmg);
      const ang = Math.atan2(w.y - y, w.x - x) || 0;
      const force = (1 - dist / falloff) * 10;
      w.vx += Math.cos(ang) * force;
      w.vy += Math.sin(ang) * force - 3;
      w.onGround = false;
      if (dmg > 0) floatingTexts.push({ x: w.x, y: w.y - 30, text: `-${dmg}`, life: 60 });
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

    let shouldExplode = false;
    let outOfBounds = false;

    if (pr.x < -20 || pr.x > CANVAS_W + 20 || pr.y > CANVAS_H + 40) outOfBounds = true;

    const hitTerrain = !outOfBounds && terrain.isSolid(pr.x, pr.y);
    let hitPlayer = null;
    if (!outOfBounds) {
      for (const pl of players) {
        if (Math.hypot(pl.x - pr.x, pl.y - pr.y) < HORN_RADIUS) { hitPlayer = pl; break; }
      }
    }

    if (pr.type === 'grenade') {
      pr.fuse -= dt;
      if (hitTerrain) {
        // simple bounce: reflect vertical velocity, damp
        pr.y -= pr.vy; // step back out of terrain
        pr.vy *= -w.bounce;
        pr.vx *= 0.7;
      }
      if (hitPlayer) {
        pr.y -= pr.vy;
        pr.vy *= -w.bounce;
      }
      if (pr.fuse <= 0 || outOfBounds) shouldExplode = !outOfBounds;
      if (outOfBounds) { projectiles.splice(i, 1); continue; }
      if (pr.fuse <= 0) {
        explode(pr.x, pr.y, w.radius, w.damage);
        projectiles.splice(i, 1);
        continue;
      }
    } else {
      if (hitTerrain || hitPlayer) {
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

  // Players: gravity, ground snap, fall-into-water KO
  for (const p of players) {
    if (!p.alive) continue;
    if (!terrain.isSolid(p.x, p.y + HORN_RADIUS + 1)) {
      p.vy += GRAVITY;
      p.onGround = false;
    } else {
      p.vy = 0;
      p.onGround = true;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.9;

    // pop out if embedded (e.g. crater edge)
    let guard = 0;
    while (terrain.isSolid(p.x, p.y) && guard < 40) { p.y -= 2; guard++; }

    p.x = Math.max(HORN_RADIUS, Math.min(CANVAS_W - HORN_RADIUS, p.x));

    if (p.y > WATER_LEVEL || p.health <= 0) {
      if (p.alive) {
        p.alive = false;
        p.health = 0;
      }
    }
  }

  // charging power ramps up while held
  const p = currentPlayer();
  if (p && p.charging) {
    p.power = Math.min(100, p.power + 1.6);
  }

  checkGameOver();

  // Turn resolution: once no projectiles/particles are active and player isn't charging, end turn
  if (phase === 'resolving' && pendingSpawns === 0 && projectiles.length === 0 && particles.length === 0) {
    const settled = players.every(pl => !pl.alive || pl.onGround);
    if (settled) endTurn();
  }
}

function checkGameOver() {
  if (phase === 'gameover') return;
  const dead = players.find(p => !p.alive);
  if (dead) {
    phase = 'gameover';
    const winner = players.find(p => p !== dead);
    const updated = recordWin(winner.key);
    stats = updated;
    showGameOver(winner);
  }
}

function endTurn() {
  activeIndex = 1 - activeIndex;
  turnTimeLeft = TURN_SECONDS;
  wind = Math.max(-1, Math.min(1, wind + (Math.random() * 0.6 - 0.3)));
  const p = currentPlayer();
  p.power = 0;
  p.charging = false;
  phase = 'aiming';
  refreshHUD();
}

function tickInputMovement() {
  if (phase !== 'aiming') return;
  const p = currentPlayer();
  const left = p.key === 'p1' ? 'a' : 'ArrowLeft';
  const right = p.key === 'p1' ? 'd' : 'ArrowRight';
  const up = p.key === 'p1' ? 'w' : 'ArrowUp';
  const down = p.key === 'p1' ? 's' : 'ArrowDown';

  if (keys.has(left)) { tryMove(p, -MOVE_SPEED); p.facing = -1; }
  if (keys.has(right)) { tryMove(p, MOVE_SPEED); p.facing = 1; }
  if (keys.has(up)) p.aimAngle = Math.min(85, p.aimAngle + 1.6);
  if (keys.has(down)) p.aimAngle = Math.max(-40, p.aimAngle - 1.6);
}

function tryMove(p, dx) {
  const steps = [0, -6, -12];
  for (const s of steps) {
    const testY = p.y + s;
    if (!terrain.isSolid(p.x + dx, testY) && !terrain.isSolid(p.x + dx, testY + HORN_RADIUS)) {
      p.x += dx;
      if (s < 0) p.y = testY;
      p.x = Math.max(HORN_RADIUS, Math.min(CANVAS_W - HORN_RADIUS, p.x));
      return;
    }
  }
}

// ---------- Touch / on-screen controls ----------
// One shared pad, since the device gets passed between turns — it always
// drives whoever's turn it currently is, rather than having a fixed side.
function activeKeyFor(dir) {
  const p = currentPlayer();
  const map = p.key === 'p1'
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
  bindHold(
    document.getElementById('tp-fire'),
    () => { if (phase === 'aiming') startCharging(currentPlayer()); },
    () => { if (phase === 'aiming') releaseFire(currentPlayer()); }
  );
}

// ---------- Turn timer ----------
function tickTimer(dt) {
  if (phase !== 'aiming') return;
  turnTimeLeft -= dt / 1000;
  if (turnTimeLeft <= 0) {
    turnTimeLeft = 0;
    const p = currentPlayer();
    p.charging = false;
    p.power = 0;
    phase = 'resolving';
  }
}

// ---------- Rendering ----------
function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#bfe9ff');
  sky.addColorStop(1, '#eaf7ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // water
  const waterGrad = ctx.createLinearGradient(0, WATER_LEVEL, 0, CANVAS_H);
  waterGrad.addColorStop(0, '#3aa9d8');
  waterGrad.addColorStop(1, '#1c5f85');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, WATER_LEVEL, CANVAS_W, CANVAS_H - WATER_LEVEL);

  terrain.draw(ctx);

  // combatants
  for (const p of players) drawCombatant(p);

  // projectiles
  for (const pr of projectiles) {
    ctx.fillStyle = pr.type === 'grenade' ? '#8a6bff' : '#ffcf4d';
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.type === 'grenade' ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // particles
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

function drawCombatant(p) {
  if (!p.alive) return;
  ctx.save();
  ctx.translate(p.x, p.y);

  // body
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, HORN_RADIUS, HORN_RADIUS * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // horn
  ctx.fillStyle = '#fff2b8';
  ctx.beginPath();
  const hx = p.facing * HORN_RADIUS * 0.8;
  ctx.moveTo(hx, -HORN_RADIUS * 0.6);
  ctx.lineTo(hx + p.facing * 16, -HORN_RADIUS * 1.6);
  ctx.lineTo(hx + p.facing * 4, -HORN_RADIUS * 0.3);
  ctx.closePath();
  ctx.fill();

  // eye
  ctx.fillStyle = '#101025';
  ctx.beginPath();
  ctx.arc(p.facing * 5, -3, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // aim line (only when it's this combatant's turn)
  if (players[activeIndex] === p && phase === 'aiming') {
    const rad = (p.aimAngle * Math.PI) / 180;
    const effAngle = p.facing === 1 ? rad : Math.PI - rad;
    const len = 26 + (p.charging ? p.power * 0.4 : 0);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(effAngle) * len, -Math.sin(effAngle) * len);
    ctx.stroke();
  }

  ctx.restore();

  // name + health bar
  ctx.textAlign = 'center';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#101025';
  ctx.fillText(p.name, p.x, p.y - HORN_RADIUS - 22);
  const barW = 40;
  ctx.fillStyle = '#00000033';
  ctx.fillRect(p.x - barW / 2, p.y - HORN_RADIUS - 16, barW, 6);
  ctx.fillStyle = p.health > 40 ? '#4caf50' : '#e53935';
  ctx.fillRect(p.x - barW / 2, p.y - HORN_RADIUS - 16, barW * (p.health / 100), 6);
}

function drawHUD() {
  // turn banner
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  const p = currentPlayer();
  if (p) {
    ctx.fillStyle = p.key === 'p1' ? '#2b6fa3' : '#a3306f';
    ctx.fillText(`${p.name}'s turn — ${getWeapon(p.selectedWeapon).name}`, 12, 22);
  }

  // timer
  ctx.textAlign = 'right';
  ctx.fillStyle = turnTimeLeft < 6 ? '#e53935' : '#333';
  ctx.fillText(`${Math.ceil(turnTimeLeft)}s`, CANVAS_W - 12, 22);

  // wind indicator
  ctx.textAlign = 'center';
  ctx.fillStyle = '#333';
  ctx.fillText('WIND', CANVAS_W / 2, 16);
  const wx = CANVAS_W / 2;
  ctx.save();
  ctx.translate(wx, 30);
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

  // power meter
  if (p && p.charging) {
    ctx.fillStyle = '#00000033';
    ctx.fillRect(CANVAS_W / 2 - 60, CANVAS_H - 24, 120, 10);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(CANVAS_W / 2 - 60, CANVAS_H - 24, 120 * (p.power / 100), 10);
  }
}

// ---------- Game over ----------
function showGameOver(winner) {
  overlayTitle.textContent = `${winner.name} wins!`;
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
