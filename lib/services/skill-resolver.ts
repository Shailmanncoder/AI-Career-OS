export type ResolvableSkill = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
};

export function normalizeSkillKey(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\+\+/g, "pp")
    .replace(/#/g, "sharp")
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class SkillResolver {
  private exact = new Map<string, ResolvableSkill>();
  private collapsed = new Map<string, ResolvableSkill>();
  private skills: ResolvableSkill[];

  constructor(skills: ResolvableSkill[]) {
    this.skills = skills;
    for (const skill of skills) {
      const keys = [skill.slug, skill.name, ...skill.aliases];
      for (const key of keys) {
        const normalized = normalizeSkillKey(key);
        if (!normalized) continue;
        if (!this.exact.has(normalized)) this.exact.set(normalized, skill);
        const collapsedKey = normalized.replace(/\s+/g, "");
        if (!this.collapsed.has(collapsedKey)) this.collapsed.set(collapsedKey, skill);
      }
    }
  }

  resolve(rawName: string): ResolvableSkill | null {
    const normalized = normalizeSkillKey(rawName);
    if (!normalized) return null;

    const direct = this.exact.get(normalized);
    if (direct) return direct;

    const collapsed = this.collapsed.get(normalized.replace(/\s+/g, ""));
    if (collapsed) return collapsed;

    const withoutNoise = normalized
      .replace(/\b(framework|library|language|development|programming|basic|basics|advanced|fundamentals)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (withoutNoise && withoutNoise !== normalized) {
      const cleaned =
        this.exact.get(withoutNoise) ?? this.collapsed.get(withoutNoise.replace(/\s+/g, ""));
      if (cleaned) return cleaned;
    }

    const tokens = normalized.split(" ").filter((token) => token.length > 2);
    if (tokens.length === 0) return null;

    let best: { skill: ResolvableSkill; score: number } | null = null;
    for (const skill of this.skills) {
      const candidateKeys = [skill.name, ...skill.aliases].map(normalizeSkillKey);
      for (const key of candidateKeys) {
        if (!key) continue;
        const keyTokens = key.split(" ").filter((token) => token.length > 2);
        if (keyTokens.length === 0) continue;
        const overlap = keyTokens.filter((token) => tokens.includes(token)).length;
        if (overlap === 0) continue;
        const score = overlap / Math.max(keyTokens.length, tokens.length);
        if (score >= 0.75 && (!best || score > best.score)) {
          best = { skill, score };
        }
      }
    }

    return best?.skill ?? null;
  }

  detectMentions(text: string): ResolvableSkill[] {
    const haystack = ` ${normalizeSkillKey(text)} `;
    const found = new Map<string, ResolvableSkill>();

    for (const skill of this.skills) {
      const candidates = [skill.name, ...skill.aliases];
      for (const candidate of candidates) {
        const normalized = normalizeSkillKey(candidate);
        if (normalized.length < 2) continue;
        if (haystack.includes(` ${normalized} `)) {
          found.set(skill.id, skill);
          break;
        }
      }
    }

    return Array.from(found.values());
  }
}
