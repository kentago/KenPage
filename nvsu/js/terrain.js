// Terrain is stored as pixel data on an offscreen canvas.
// The alpha channel doubles as the collision mask: alpha > 0 means solid.
// Explosions "erase" a circle from it (destination-out), which is what
// gives us destructible ground for free.

const TERRAIN_SEGMENTS = 64;

function midpointDisplace(heights, left, right, roughness) {
  if (right - left < 2) return;
  const mid = Math.floor((left + right) / 2);
  const avg = (heights[left] + heights[right]) / 2;
  const offset = (Math.random() * 2 - 1) * roughness;
  heights[mid] = avg + offset;
  midpointDisplace(heights, left, mid, roughness * 0.55);
  midpointDisplace(heights, mid, right, roughness * 0.55);
}

function generateHeightProfile(width, minY, maxY) {
  const heights = new Array(TERRAIN_SEGMENTS + 1).fill(0);
  heights[0] = minY + Math.random() * (maxY - minY);
  heights[TERRAIN_SEGMENTS] = minY + Math.random() * (maxY - minY);
  midpointDisplace(heights, 0, TERRAIN_SEGMENTS, (maxY - minY) * 0.6);
  // clamp
  for (let i = 0; i <= TERRAIN_SEGMENTS; i++) {
    heights[i] = Math.max(minY, Math.min(maxY, heights[i]));
  }
  return heights;
}

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
    const heights = generateHeightProfile(this.width, minY, maxY);

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

    // remember surface heights for spawn placement
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
