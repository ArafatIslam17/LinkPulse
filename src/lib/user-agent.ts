import { UAParser } from "ua-parser-js";

export type Device = "desktop" | "mobile" | "tablet" | "other";

// Link-preview crawlers and bots fetch short links when they're pasted into chats.
// Counting them would inflate clicks, so they're redirected but not recorded.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora link|whatsapp|telegram|discord|skype|vkshare|bitlybot|curl|wget|python-requests|httpclient|headless|lighthouse|pingdom|uptime|monitor/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

export function parseUserAgent(userAgent: string | null | undefined) {
  const parsed = new UAParser(userAgent ?? "").getResult();
  const type = parsed.device.type;
  let device: Device = "desktop";
  if (type === "mobile") device = "mobile";
  else if (type === "tablet") device = "tablet";
  else if (type && type !== "desktop") device = "other";

  return {
    device,
    browser: parsed.browser.name?.slice(0, 48) ?? null,
    os: parsed.os.name?.slice(0, 48) ?? null,
  };
}

/** Keeps only the referring hostname, dropping paths and query strings. */
export function referrerHost(referrer: string | null | undefined, ownHost?: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    if (!host) return null;
    if (ownHost && host === ownHost.split(":")[0].toLowerCase().replace(/^www\./, "")) return null;
    return host.slice(0, 255);
  } catch {
    return null;
  }
}
