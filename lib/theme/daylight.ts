import {
  DAYLIGHT_CACHE_KEY,
  DAYLIGHT_CACHE_TTL_MS,
  type ResolvedTheme,
} from "./constants";

export type DaylightSource = "weather-api" | "local-clock" | "cache";

export type DaylightReading = {
  isDay: boolean;
  source: DaylightSource;
  resolvedAt: number;
  place?: string;
};

const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 6000;

export function daylightFromClock(now = new Date()): DaylightReading {
  const hour = now.getHours();
  return {
    isDay: hour >= 7 && hour < 19,
    source: "local-clock",
    resolvedAt: Date.now(),
  };
}

export function themeFromReading(reading: DaylightReading): ResolvedTheme {
  return reading.isDay ? "light" : "dark";
}

export function readCachedDaylight(): DaylightReading | null {
  try {
    const raw = localStorage.getItem(DAYLIGHT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DaylightReading;
    if (typeof parsed?.isDay !== "boolean" || typeof parsed?.resolvedAt !== "number") return null;
    if (Date.now() - parsed.resolvedAt > DAYLIGHT_CACHE_TTL_MS) return null;
    return { ...parsed, source: "cache" };
  } catch {
    return null;
  }
}

export function writeCachedDaylight(reading: DaylightReading) {
  try {
    localStorage.setItem(DAYLIGHT_CACHE_KEY, JSON.stringify(reading));
  } catch {
    return;
  }
}

export function requestCoordinates(): Promise<GeolocationCoordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), REQUEST_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        resolve(position.coords);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { timeout: REQUEST_TIMEOUT_MS, maximumAge: DAYLIGHT_CACHE_TTL_MS, enableHighAccuracy: false },
    );
  });
}

export async function fetchDaylight(
  latitude: number,
  longitude: number,
): Promise<DaylightReading | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(OPEN_METEO_ENDPOINT);
    url.searchParams.set("latitude", latitude.toFixed(2));
    url.searchParams.set("longitude", longitude.toFixed(2));
    url.searchParams.set("current", "is_day");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) return null;

    const payload = (await response.json()) as { current?: { is_day?: number } };
    const isDayValue = payload.current?.is_day;
    if (isDayValue !== 0 && isDayValue !== 1) return null;

    return { isDay: isDayValue === 1, source: "weather-api", resolvedAt: Date.now() };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveDaylight(allowLocation: boolean): Promise<DaylightReading> {
  const cached = readCachedDaylight();
  if (cached) return cached;

  if (allowLocation) {
    const coords = await requestCoordinates();
    if (coords) {
      const reading = await fetchDaylight(coords.latitude, coords.longitude);
      if (reading) {
        writeCachedDaylight(reading);
        return reading;
      }
    }
  }

  const fallback = daylightFromClock();
  writeCachedDaylight(fallback);
  return fallback;
}
