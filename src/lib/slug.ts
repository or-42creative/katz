import { customAlphabet } from "nanoid";

// Lowercase letters + digits, avoiding ambiguous characters (0/o, 1/l/i).
const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
const generate = customAlphabet(alphabet, 7);

// Top-level paths that must never be used as a slug (they are real routes).
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "link",
  "auth",
  "login",
  "logout",
  "settings",
  "dashboard",
  "_next",
  "favicon.ico",
]);

export function randomSlug(): string {
  return generate();
}

const SLUG_RE = /^[a-zA-Z0-9_-]+$/;

export function validateCustomSlug(slug: string): string | null {
  const value = slug.trim();
  if (!value) return "כתובת מותאמת ריקה";
  if (value.length > 50) return "כתובת מותאמת ארוכה מדי (עד 50 תווים)";
  if (!SLUG_RE.test(value)) {
    return "מותר רק אותיות באנגלית, ספרות, מקף (-) וקו תחתון (_)";
  }
  if (RESERVED_SLUGS.has(value.toLowerCase())) {
    return "הכתובת הזו שמורה למערכת, בחרו אחרת";
  }
  return null;
}
