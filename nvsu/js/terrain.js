// Terrain is stored as pixel data on an offscreen canvas.
// The alpha channel doubles as the collision mask: alpha > 0 means solid.
// Explosions "erase" a circle from it (destination-out), which is what
// gives us destructible ground for free.
//
// Map styles:
//   'mainland' — one connected landmass (classic).
//   'islands'  — two landmasses split by open water; no walking across.
//   'bridges'  — two landmasses joined by a single thin, destructible
//                causeway. It can be walked across right up until
//                someone lobs a bazooka or grenade at it.
//
// The two spawn zones (each pod's 3 members) always sit inside the two
// landmasses regardless of style, so nobody spawns in open water.

const TERRAIN_SEGMENTS = 64;
const ISLAND_LEFT_END = 0.34;   // left landmass spans [0, 0.34]
const ISLAND_RIGHT_START = 0.66; // right landmass spans [0.66, 1]
const BRIDGE_THICKNESS = 20;

function midpointDisplace(heights, left, right, roughness) {
  if (right - left < 2) return;
  const mid = Math.floor((left + right) / 2);
  const avg = (heights[left] + heights[right]) / 2;
  const offset = (Math.random() * 2 - 1) * roughness;
  heights[mid] = avg + offset;
  midpointDisplace(heights, left, mid, roughness * 0.55);
  midpointDisplace(heights, mid, right, roughness * 0.55);
}

function generateHeightProfile(minY, maxY) {
  const heights = new Array(TERRAIN_SEGMENTS + 1).fill(0);
  heights[0] = minY + Math.random() * (maxY - minY);
  heights[TERRAIN_SEGMENTS] = minY + Math.random() * (maxY - minY);
  midpointDisplace(heights, 0, TERRAIN_SEGMENTS, (maxY - minY) * 0.6);
  for (let i = 0; i <= TERRAIN_SEGMENTS; i++) {
    heights[i] = Math.max(minY, Math.min(maxY, heights[i]));
  }
  return heights;
}

function pickMapStyle() {
  const r = Math.random();
  if (r < 0.34) return 'mainland';
  if (r < 0.67) return 'islands';
  return 'bridges';
}

const MAP_STYLE_LABELS = {
  mainland: 'Mainland',
  islands: 'Twin Isles',
  bridges: 'Bridged Isles',
};

class Terrain {
  constructor(width, height, waterLevel) {
    this.width = width;
    this.height = height;
    this.waterLevel = waterLevel;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.generate();
  }

  generate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const minY = this.height * 0.42;
    const maxY = this.height * 0.72;
    const baseHeights = generateHeightProfile(minY, maxY);

    const style = pickMapStyle();
    this.mapStyle = style;
    this.bridgeRun = null; // {startX, endX} in pixels, if a bridge exists

    const heights = baseHeights.slice();

    if (style !== 'mainland') {
      // decide, per segment, whether it's part of a landmass, open water,
      // or (for 'bridges') the causeway strip.
      let bridgeStartFrac = null, bridgeEndFrac = null;
      if (style === 'bridges') {
        const bridgeWidthFrac = 0.10 + Math.random() * 0.05;
        const contestedWidth = ISLAND_RIGHT_START - ISLAND_LEFT_END;
        const margin = 0.03;
        bridgeStartFrac = ISLAND_LEFT_END + margin +
          Math.random() * (contestedWidth - bridgeWidthFrac - margin * 2);
        bridgeEndFrac = bridgeStartFrac + bridgeWidthFrac;
      }

      const bridgeTopY = this.waterLevel - 40;

      for (let i = 0; i <= TERRAIN_SEGMENTS; i++) {
        const frac = i / TERRAIN_SEGMENTS;
        const onLand = frac <= ISLAND_LEFT_END || frac >= ISLAND_RIGHT_START;
        if (onLand) continue; // keep baseHeights value

        const onBridge = style === 'bridges' && frac >= bridgeStartFrac && frac <= bridgeEndFrac;
        heights[i] = onBridge ? bridgeTopY : this.height; // this.height => no fill (open water)
      }

      if (style === 'bridges') {
        this.bridgeRun = {
          startX: bridgeStartFrac * this.width,
          endX: bridgeEndFrac * this.width,
          topY: bridgeTopY,
        };
      }
    }

    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let i = 0; i <= TERRAIN_SEGMENTS; i++) {
      const x = (i / TERRAIN_SEGMENTS) * this.width;
      ctx.lineTo(x, heights[i]);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, minY, 0, this.height);
    grad.addColorStop(0, '#8fe37a');
    grad.addColorStop(0.08, '#6bbf59');
    grad.addColorStop(0.15, '#8a5a3b');
    grad.addColorStop(1, '#4a3524');
    ctx.fillStyle = grad;
    ctx.fill();

    // A bridge segment was filled as a full pillar down to the canvas
    // floor (same polygon-fill approach as everything else). Punch the
    // pillar out below the deck so it becomes a thin, floating,
    // destructible causeway instead of a solid column of rock.
    if (this.bridgeRun) {
      const { startX, endX, topY } = this.bridgeRun;
      const deckBottom = topY + BRIDGE_THICKNESS;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(startX - 2, deckBottom, (endX - startX) + 4, this.height - deckBottom);
      ctx.restore();

      // simple plank styling so it visually reads as a bridge, not dirt
      ctx.fillStyle = '#8a6239';
      ctx.fillRect(startX, topY, endX - startX, BRIDGE_THICKNESS);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (let px = startX + 8; px < endX; px += 14) {
        ctx.beginPath();
        ctx.moveTo(px, topY);
        ctx.lineTo(px, topY + BRIDGE_THICKNESS);
        ctx.stroke();
      }
    }

    this.heights = heights;
  }

  surfaceYAt(x) {
    const seg = Math.max(0, Math.min(TERRAIN_SEGMENTS, Math.round((x / this.width) * TERRAIN_SEGMENTS)));
    return this.heights[seg];
  }

  isSolid(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const data = this.ctx.getImageData(x | 0, y | 0, 1, 1).data;
    return data[3] > 30;
  }

  carve(x, y, radius) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  draw(targetCtx) {
    targetCtx.drawImage(this.canvas, 0, 0);
  }
}
