export function stripCodeFences(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function extractJsonBlock(raw: string): string | null {
  const source = stripCodeFences(raw);
  const openers = ["{", "["];
  const start = source.split("").findIndex((char) => openers.includes(char));
  if (start === -1) return null;

  const opening = source[start];
  const closing = opening === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === opening) depth += 1;
    if (char === closing) {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  return null;
}

export function parseJsonLoose(raw: string): unknown | null {
  const block = extractJsonBlock(raw);
  if (!block) return null;
  try {
    return JSON.parse(block);
  } catch {
    try {
      return JSON.parse(block.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}
