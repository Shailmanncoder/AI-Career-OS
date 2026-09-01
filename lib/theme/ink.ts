export type InkOrigin = { x: number; y: number };

export type InkBlob = {
  angle: number;
  distance: number;
  size: number;
  delay: number;
};

export type InkDroplet = {
  angle: number;
  distance: number;
  size: number;
  delay: number;
  opacity: number;
};

export type InkPlan = {
  origin: InkOrigin;
  radius: number;
  blobs: InkBlob[];
  droplets: InkDroplet[];
};

export const INK_DURATION_MS = 950;
export const INK_THEME_SWAP_AT = 0.55;
export const INK_REVEAL_MS = 190;

export const BLOB_COUNT = 16;
export const DROPLET_COUNT = 13;

export function coverageRadius(origin: InkOrigin, width: number, height: number) {
  const reach = Math.hypot(
    Math.max(origin.x, width - origin.x),
    Math.max(origin.y, height - origin.y),
  );
  return reach * 1.25;
}

export function clampOrigin(origin: InkOrigin | null, width: number, height: number): InkOrigin {
  if (!origin) return { x: width / 2, y: height / 2 };
  return {
    x: Math.min(Math.max(origin.x, 0), width),
    y: Math.min(Math.max(origin.y, 0), height),
  };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createInkPlan(
  origin: InkOrigin,
  width: number,
  height: number,
  seed = Date.now(),
): InkPlan {
  const random = mulberry32(seed);
  const radius = coverageRadius(origin, width, height);

  const blobs: InkBlob[] = Array.from({ length: BLOB_COUNT }, (_, index) => {
    const spread = (index / BLOB_COUNT) * Math.PI * 2;
    return {
      angle: spread + (random() - 0.5) * 0.9,
      distance: 0.55 + random() * 0.55,
      size: 0.6 + random() * 0.8,
      delay: random() * 120,
    };
  });

  const droplets: InkDroplet[] = Array.from({ length: DROPLET_COUNT }, (_, index) => {
    const spread = (index / DROPLET_COUNT) * Math.PI * 2;
    return {
      angle: spread + (random() - 0.5) * 1.4,
      distance: 0.82 + random() * 0.34,
      size: 4 + random() * 26,
      delay: 150 + random() * 300,
      opacity: 0.3 + random() * 0.7,
    };
  });

  return { origin, radius, blobs, droplets };
}

export function easeInk(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const p0 = 0;
  const p1 = 0;
  const p2 = 1;
  const p3 = 1;
  const x1 = 0.65;
  const y1 = 0;
  const x2 = 0.25;
  const y2 = 1;

  let low = 0;
  let high = 1;
  let guess = clamped;

  for (let i = 0; i < 18; i += 1) {
    const x =
      3 * (1 - guess) * (1 - guess) * guess * x1 + 3 * (1 - guess) * guess * guess * x2 + guess ** 3;
    if (Math.abs(x - clamped) < 0.0005) break;
    if (x < clamped) low = guess;
    else high = guess;
    guess = (low + high) / 2;
  }

  void p0;
  void p1;
  void p2;
  void p3;

  return 3 * (1 - guess) * (1 - guess) * guess * y1 + 3 * (1 - guess) * guess * guess * y2 + guess ** 3;
}

export function mainRadiusAt(progress: number, radius: number) {
  return easeInk(progress) * radius;
}

export function blobRadiusAt(progress: number, plan: InkPlan, blob: InkBlob) {
  const shifted = (progress * INK_DURATION_MS - blob.delay) / INK_DURATION_MS;
  if (shifted <= 0) return 0;
  return easeInk(shifted) * plan.radius * 0.42 * blob.size;
}

export function blobCenter(progress: number, plan: InkPlan, blob: InkBlob) {
  const travel = easeInk(progress) * plan.radius * blob.distance;
  return {
    x: plan.origin.x + Math.cos(blob.angle) * travel,
    y: plan.origin.y + Math.sin(blob.angle) * travel,
  };
}

export function dropletStateAt(elapsedMs: number, plan: InkPlan, droplet: InkDroplet) {
  const start = droplet.delay;
  const end = start + 320;
  if (elapsedMs < start) return { radius: 0, opacity: 0, x: 0, y: 0 };

  const local = Math.min(1, (elapsedMs - start) / (end - start));
  const eased = easeInk(local);
  const travel = plan.radius * droplet.distance * (0.75 + eased * 0.25);
  const fade = local < 0.7 ? droplet.opacity : droplet.opacity * (1 - (local - 0.7) / 0.3);

  return {
    radius: droplet.size * (0.2 + eased * 0.8),
    opacity: Math.max(0, fade),
    x: plan.origin.x + Math.cos(droplet.angle) * travel,
    y: plan.origin.y + Math.sin(droplet.angle) * travel,
  };
}
