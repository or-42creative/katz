export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

/**
 * Normalizes a user-entered destination URL and appends UTM parameters.
 * Returns the final URL string, or throws if the URL is invalid.
 */
export function buildDestinationUrl(rawUrl: string, utm: UtmParams): string {
  let input = rawUrl.trim();
  if (!input) throw new Error("חסר לינק");

  // Prepend protocol if the user didn't type one.
  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("הלינק לא תקין");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("מותר רק לינקים מסוג http / https");
  }

  const map: Record<string, string | undefined> = {
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    utm_term: utm.term,
    utm_content: utm.content,
  };

  for (const [key, value] of Object.entries(map)) {
    const v = value?.trim();
    if (v) url.searchParams.set(key, v);
  }

  return url.toString();
}

/** Extracts a readable source label from a referer URL. */
export function refererSource(referer: string | null | undefined): string {
  if (!referer) return "ישיר";
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    return host || "ישיר";
  } catch {
    return "ישיר";
  }
}
