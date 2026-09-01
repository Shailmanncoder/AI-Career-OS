import { describe, expect, it } from "vitest";
import {
  BLOB_COUNT,
  DROPLET_COUNT,
  INK_DURATION_MS,
  INK_THEME_SWAP_AT,
  blobCenter,
  blobRadiusAt,
  clampOrigin,
  coverageRadius,
  createInkPlan,
  dropletStateAt,
  easeInk,
  mainRadiusAt,
} from "@/lib/theme/ink";

const W = 1440;
const H = 900;

describe("coverageRadius", () => {
  it("covers the far corner from a top-right origin", () => {
    const origin = { x: W - 40, y: 40 };
    const r = coverageRadius(origin, W, H);
    const farCorner = Math.hypot(origin.x - 0, H - origin.y);
    expect(r).toBeGreaterThan(farCorner);
  });

  it("covers every corner from the centre", () => {
    const origin = { x: W / 2, y: H / 2 };
    const r = coverageRadius(origin, W, H);
    for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) {
      expect(r).toBeGreaterThan(Math.hypot(origin.x - cx, origin.y - cy));
    }
  });

  it("scales with viewport size", () => {
    const small = coverageRadius({ x: 100, y: 100 }, 375, 812);
    const wide = coverageRadius({ x: 100, y: 100 }, 3440, 1440);
    expect(wide).toBeGreaterThan(small);
  });
});

describe("clampOrigin", () => {
  it("defaults to the viewport centre when no origin is given", () => {
    expect(clampOrigin(null, W, H)).toEqual({ x: W / 2, y: H / 2 });
  });

  it("keeps an off-screen origin inside the viewport", () => {
    expect(clampOrigin({ x: -500, y: 5000 }, W, H)).toEqual({ x: 0, y: H });
  });

  it("passes a valid origin through untouched", () => {
    expect(clampOrigin({ x: 12, y: 34 }, W, H)).toEqual({ x: 12, y: 34 });
  });
});

describe("easeInk", () => {
  it("is pinned at both ends", () => {
    expect(easeInk(0)).toBeCloseTo(0, 3);
    expect(easeInk(1)).toBeCloseTo(1, 3);
  });

  it("is monotonically increasing", () => {
    let previous = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeInk(t);
      expect(v).toBeGreaterThanOrEqual(previous - 1e-6);
      previous = v;
    }
  });

  it("is not linear, so the spread accelerates", () => {
    expect(Math.abs(easeInk(0.5) - 0.5)).toBeGreaterThan(0.01);
  });

  it("clamps out-of-range input", () => {
    expect(easeInk(-2)).toBeCloseTo(0, 3);
    expect(easeInk(4)).toBeCloseTo(1, 3);
  });
});

describe("createInkPlan", () => {
  const plan = createInkPlan({ x: 700, y: 300 }, W, H, 12345);

  it("produces the specified number of blobs and droplets", () => {
    expect(plan.blobs).toHaveLength(BLOB_COUNT);
    expect(plan.droplets).toHaveLength(DROPLET_COUNT);
    expect(BLOB_COUNT).toBeGreaterThanOrEqual(12);
    expect(BLOB_COUNT).toBeLessThanOrEqual(20);
    expect(DROPLET_COUNT).toBeGreaterThanOrEqual(10);
    expect(DROPLET_COUNT).toBeLessThanOrEqual(15);
  });

  it("is deterministic for a given seed, so edges do not jitter per frame", () => {
    const again = createInkPlan({ x: 700, y: 300 }, W, H, 12345);
    expect(again.blobs).toEqual(plan.blobs);
    expect(again.droplets).toEqual(plan.droplets);
  });

  it("varies between seeds so repeat transitions differ", () => {
    const other = createInkPlan({ x: 700, y: 300 }, W, H, 999);
    expect(other.blobs).not.toEqual(plan.blobs);
  });

  it("keeps blob parameters inside the specified ranges", () => {
    for (const blob of plan.blobs) {
      expect(blob.distance).toBeGreaterThanOrEqual(0.55);
      expect(blob.distance).toBeLessThanOrEqual(1.1);
      expect(blob.size).toBeGreaterThanOrEqual(0.6);
      expect(blob.size).toBeLessThanOrEqual(1.4);
      expect(blob.delay).toBeGreaterThanOrEqual(0);
      expect(blob.delay).toBeLessThanOrEqual(120);
    }
  });

  it("keeps droplet parameters inside the specified ranges", () => {
    for (const d of plan.droplets) {
      expect(d.size).toBeGreaterThanOrEqual(4);
      expect(d.size).toBeLessThanOrEqual(30);
      expect(d.opacity).toBeGreaterThanOrEqual(0.3);
      expect(d.opacity).toBeLessThanOrEqual(1);
      expect(d.delay).toBeGreaterThanOrEqual(150);
      expect(d.delay).toBeLessThanOrEqual(450);
    }
  });

  it("distributes blobs around the full circle rather than clustering", () => {
    const quadrants = new Set(
      plan.blobs.map((b) => Math.floor((((b.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2))),
    );
    expect(quadrants.size).toBe(4);
  });
});

describe("expansion geometry", () => {
  const plan = createInkPlan({ x: 720, y: 450 }, W, H, 77);

  it("starts from nothing and ends fully covering", () => {
    expect(mainRadiusAt(0, plan.radius)).toBeCloseTo(0, 3);
    expect(mainRadiusAt(1, plan.radius)).toBeCloseTo(plan.radius, 3);
  });

  it("swaps the theme past the midpoint of the spread", () => {
    expect(INK_THEME_SWAP_AT).toBeGreaterThan(0.5);
    expect(INK_THEME_SWAP_AT).toBeLessThan(0.7);
    expect(mainRadiusAt(INK_THEME_SWAP_AT, plan.radius)).toBeGreaterThan(plan.radius * 0.5);
  });

  it("holds delayed blobs at zero until their delay elapses", () => {
    const delayed = { ...plan.blobs[0], delay: 120 };
    expect(blobRadiusAt(0.05, plan, delayed)).toBe(0);
    expect(blobRadiusAt(1, plan, delayed)).toBeGreaterThan(0);
  });

  it("pushes blob centres outward from the origin over time", () => {
    const blob = plan.blobs[0];
    const early = blobCenter(0.2, plan, blob);
    const late = blobCenter(0.9, plan, blob);
    const dEarly = Math.hypot(early.x - plan.origin.x, early.y - plan.origin.y);
    const dLate = Math.hypot(late.x - plan.origin.x, late.y - plan.origin.y);
    expect(dLate).toBeGreaterThan(dEarly);
  });

  it("hides droplets before their delay and fades them before the end", () => {
    const droplet = plan.droplets[0];
    expect(dropletStateAt(0, plan, droplet).radius).toBe(0);
    expect(dropletStateAt(droplet.delay + 160, plan, droplet).opacity).toBeGreaterThan(0);
    expect(dropletStateAt(INK_DURATION_MS, plan, droplet).opacity).toBeCloseTo(0, 2);
  });

  it("never emits a negative radius or opacity", () => {
    for (let ms = 0; ms <= INK_DURATION_MS; ms += 25) {
      const p = ms / INK_DURATION_MS;
      expect(mainRadiusAt(p, plan.radius)).toBeGreaterThanOrEqual(0);
      for (const blob of plan.blobs) expect(blobRadiusAt(p, plan, blob)).toBeGreaterThanOrEqual(0);
      for (const d of plan.droplets) {
        const s = dropletStateAt(ms, plan, d);
        expect(s.radius).toBeGreaterThanOrEqual(0);
        expect(s.opacity).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
