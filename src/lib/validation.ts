import { linkRules } from "./config";

// Paths the app uses (or may use later) that must never become short codes.
export const RESERVED_ALIASES = new Set([
  "api", "app", "admin", "dashboard", "login", "logout", "signin", "signout", "signup",
  "register", "auth", "account", "accounts", "settings", "profile", "billing", "links", "link",
  "new", "create", "edit", "delete", "analytics", "stats", "about", "help", "support", "docs",
  "terms", "privacy", "legal", "contact", "pricing", "blog", "status", "static", "assets",
  "public", "_next", "icon", "apple-icon", "opengraph-image", "twitter-image", "favicon",
  "robots", "sitemap", "manifest", "404", "500", "www", "health",
]);

const ALIAS_PATTERN = /^[a-z0-9_-]+$/;
const CODE_PATTERN = /^[a-z0-9_-]{1,64}$/;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Normalizes and validates a destination URL. Adds https:// when the scheme is missing,
 * so "example.com/page" works the way people expect.
 */
export function validateDestinationUrl(input: string, ownHost?: string | null): ValidationResult<string> {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Enter a URL to shorten." };
  if (raw.length > linkRules.maxUrlLength) {
    return { ok: false, error: `URLs can be at most ${linkRules.maxUrlLength} characters.` };
  }
  if (/\s/.test(raw)) return { ok: false, error: "URLs can't contain spaces." };

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const looksLikeHostPort = /^[^/:]+:\d+(\/|$)/.test(raw);
  if (hasScheme && !looksLikeHostPort && !/^https?:\/\//i.test(raw)) {
    return { ok: false, error: "Only http:// and https:// links can be shortened." };
  }
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http:// and https:// links can be shortened." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "Links with embedded usernames or passwords aren't allowed." };
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return { ok: false, error: "Local addresses can't be shortened." };
  }
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isIpv6 = host.startsWith("[");
  if (!isIpv4 && !isIpv6) {
    const labels = host.split(".");
    const tld = labels[labels.length - 1];
    const validTld = /^[a-z¡-￿]{2,63}$/i.test(tld) || /^xn--[a-z0-9-]+$/.test(tld);
    if (labels.length < 2 || labels.some((l) => !l) || !validTld) {
      return { ok: false, error: "Add a full domain, like example.com." };
    }
  }
  if (ownHost && host === ownHost.toLowerCase().split(":")[0]) {
    return { ok: false, error: "That's already a short link from this site." };
  }

  return { ok: true, value: url.toString() };
}

/** Validates an optional custom alias. Returns null value when no alias was given. */
export function validateAlias(input: string | null | undefined): ValidationResult<string | null> {
  const alias = (input ?? "").trim().toLowerCase();
  if (!alias) return { ok: true, value: null };
  if (alias.length < linkRules.aliasMinLength || alias.length > linkRules.aliasMaxLength) {
    return {
      ok: false,
      error: `Aliases must be ${linkRules.aliasMinLength} to ${linkRules.aliasMaxLength} characters.`,
    };
  }
  if (!ALIAS_PATTERN.test(alias)) {
    return { ok: false, error: "Use only letters, numbers, hyphens and underscores." };
  }
  if (/^[-_]|[-_]$/.test(alias)) {
    return { ok: false, error: "Aliases can't start or end with a hyphen or underscore." };
  }
  if (RESERVED_ALIASES.has(alias)) {
    return { ok: false, error: `"${alias}" is reserved. Try a different alias.` };
  }
  return { ok: true, value: alias };
}

/** Cheap shape check before touching the database on redirects and analytics pages. */
export function normalizeCode(code: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(code);
  } catch {
    return null;
  }
  const normalized = decoded.toLowerCase();
  return CODE_PATTERN.test(normalized) ? normalized : null;
}
