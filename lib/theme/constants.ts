export const THEME_MODES = ["light", "dark", "daylight", "system"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const DAYLIGHT_CACHE_KEY = "theme:daylight";
export const DAYLIGHT_CACHE_TTL_MS = 30 * 60 * 1000;
export const DAYLIGHT_REFRESH_MS = 15 * 60 * 1000;

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && (THEME_MODES as readonly string[]).includes(value);
}
