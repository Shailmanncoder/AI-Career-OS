export type ApiClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiClientResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        message: payload?.error?.message ?? "The request failed. Please try again.",
        code: payload?.error?.code,
      };
    }

    return { ok: true, data: payload.data as T };
  } catch {
    return { ok: false, message: "Could not reach the server. Check your connection." };
  }
}

export function postJson<T>(url: string, body: unknown) {
  return requestJson<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function patchJson<T>(url: string, body: unknown) {
  return requestJson<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}
