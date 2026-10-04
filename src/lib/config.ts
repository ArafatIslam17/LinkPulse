// Product-level settings. Rename the product here and everything follows.
export const siteConfig = {
  name: "Hopline",
  tagline: "Short links that tell you who clicked.",
  description:
    "Shorten long URLs, share them anywhere, and see clicks by day, referrer, device, browser and country.",
} as const;

export const linkRules = {
  maxUrlLength: 2048,
  aliasMinLength: 3,
  aliasMaxLength: 32,
  randomCodeLength: 7,
} as const;

/** Reads a positive integer env var, falling back when it's unset, empty or invalid. */
export function envInt(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const rateLimitRules = {
  // Link creations allowed per visitor per window.
  limit: envInt("RATE_LIMIT_MAX", 20),
  windowSeconds: envInt("RATE_LIMIT_WINDOW_SECONDS", 600),
} as const;
