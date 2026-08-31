export type EducationEntry = {
  institution: string;
  degree?: string;
  field?: string;
  period?: string;
  highlights: string[];
};

export type ExperienceEntry = {
  company: string;
  title: string;
  period?: string;
  location?: string;
  highlights: string[];
};

export type ProjectEntry = {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
};

export type CertificationEntry = {
  name: string;
  issuer?: string;
  year?: string;
};

export type CareerSignalEntry = {
  role: string;
  confidence: number;
  reasoning: string;
};

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}
