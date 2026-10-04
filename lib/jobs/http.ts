// JSearch v5 regularly takes 10–20s on location-qualified queries.
const REQUEST_TIMEOUT_MS = 25_000;

export class JobProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "JobProviderError";
  }
}

export async function fetchProviderJson<T>(provider: string, url: string, headers?: HeadersInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { headers, signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      throw new JobProviderError(provider, response.status, `HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof JobProviderError) throw error;
    const message = error instanceof Error ? error.message : "request failed";
    throw new JobProviderError(provider, null, message);
  } finally {
    clearTimeout(timer);
  }
}

export function plainText(value: string | null | undefined, maxLength = 280) {
  const text = (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&#39;|&quot;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string,
  period?: string | null,
) {
  if (!min && !max) return null;
  const format = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  const range = min && max && min !== max ? `${format(min)} – ${format(max)}` : format((max || min) as number);
  return period ? `${range} / ${period.toLowerCase()}` : range;
}
