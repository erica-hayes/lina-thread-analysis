export const UNKNOWN_AUTHOR = "unknown";

export function normalizeId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.replace(/^t\d_/, "").trim();
}

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }
  return fallback;
}

export function toTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Date.now() / 1000;
}

export function countRegexMatches(input: string, regex: RegExp): number {
  if (!input) {
    return 0;
  }

  const matches = input.match(regex);
  return matches ? matches.length : 0;
}

export function toWordTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9'-]/g, ""))
    .filter(Boolean);
}