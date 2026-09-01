import { describe, expect, it } from "vitest";

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function frameValue(from: number, target: number, progress: number) {
  return Math.round(from + (target - from) * EASE_OUT_EXPO(Math.min(1, progress)));
}

describe("count-up easing", () => {
  it("starts at the origin value", () => {
    expect(frameValue(0, 66, 0)).toBe(0);
  });

  it("lands exactly on the target at completion", () => {
    expect(frameValue(0, 66, 1)).toBe(66);
    expect(frameValue(0, 80, 1)).toBe(80);
    expect(frameValue(0, 100, 1)).toBe(100);
  });

  it("never overshoots the target", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(frameValue(0, 66, p)).toBeLessThanOrEqual(66);
    }
  });

  it("clamps progress beyond one to the target", () => {
    expect(frameValue(0, 66, 5)).toBe(66);
  });

  it("counts down as well as up", () => {
    expect(frameValue(80, 20, 1)).toBe(20);
    expect(frameValue(80, 20, 0)).toBe(80);
  });

  it("is monotonic toward the target", () => {
    let previous = -1;
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const current = frameValue(0, 93, p);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});
