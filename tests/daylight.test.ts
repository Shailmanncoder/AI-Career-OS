import { describe, expect, it } from "vitest";
import { daylightFromClock, themeFromReading } from "@/lib/theme/daylight";
import { isThemeMode, THEME_MODES } from "@/lib/theme/constants";

describe("daylightFromClock", () => {
  const at = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  it("treats daytime hours as day", () => {
    for (const hour of [7, 9, 12, 15, 18]) {
      expect(daylightFromClock(at(hour)).isDay, `${hour}:00`).toBe(true);
    }
  });

  it("treats night hours as night", () => {
    for (const hour of [0, 3, 6, 19, 22, 23]) {
      expect(daylightFromClock(at(hour)).isDay, `${hour}:00`).toBe(false);
    }
  });

  it("labels its source so the UI can be honest about it", () => {
    expect(daylightFromClock(at(12)).source).toBe("local-clock");
  });

  it("stamps a resolution time", () => {
    expect(daylightFromClock(at(12)).resolvedAt).toBeGreaterThan(0);
  });
});

describe("themeFromReading", () => {
  it("maps day to light and night to dark", () => {
    expect(themeFromReading({ isDay: true, source: "weather-api", resolvedAt: 1 })).toBe("light");
    expect(themeFromReading({ isDay: false, source: "weather-api", resolvedAt: 1 })).toBe("dark");
  });
});

describe("theme modes", () => {
  it("exposes exactly the four supported modes", () => {
    expect([...THEME_MODES]).toEqual(["light", "dark", "daylight", "system"]);
  });

  it("validates stored values and rejects anything else", () => {
    expect(isThemeMode("daylight")).toBe(true);
    expect(isThemeMode("system")).toBe(true);
    expect(isThemeMode("neon")).toBe(false);
    expect(isThemeMode(null)).toBe(false);
    expect(isThemeMode(undefined)).toBe(false);
    expect(isThemeMode(3)).toBe(false);
  });
});
