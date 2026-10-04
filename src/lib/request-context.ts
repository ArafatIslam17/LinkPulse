import "server-only";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { nanoid } from "nanoid";

const OWNER_COOKIE = "hl_owner";
const TZ_COOKIE = "hl_tz";
const OWNER_PATTERN = /^[A-Za-z0-9_-]{21}$/;

/**
 * The current owner of links. There's no sign-in yet, so each browser gets an anonymous
 * id in an httpOnly cookie. When authentication is added, return the user's id here
 * and the rest of the app keeps working unchanged.
 */
export async function getOwnerId(): Promise<string | null> {
  const value = (await cookies()).get(OWNER_COOKIE)?.value;
  return value && OWNER_PATTERN.test(value) ? value : null;
}

/** Like getOwnerId, but creates the owner cookie if needed. Only call from actions or route handlers. */
export async function ensureOwnerId(): Promise<string> {
  const existing = await getOwnerId();
  if (existing) return existing;
  const id = nanoid();
  (await cookies()).set(OWNER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

/** IANA timezone reported by the browser, used for "today" / "this week" boundaries. */
export async function getTimezone(): Promise<string> {
  const value = (await cookies()).get(TZ_COOKIE)?.value;
  if (value && value.length < 64) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return value;
    } catch {
      // fall through to UTC
    }
  }
  return "UTC";
}

/** Origin of the current deployment, e.g. https://hopline.vercel.app. Never hardcoded. */
export async function getBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function getHost(): Promise<string | null> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).host;
    } catch {
      // ignore malformed override
    }
  }
  const h = await headers();
  return h.get("x-forwarded-host") ?? h.get("host");
}

/**
 * Salted, truncated hash of the client IP, used only as a short-lived rate-limit key.
 * The raw IP is never stored.
 */
export async function getClientFingerprint(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const salt = process.env.HASH_SALT || "hopline-default-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
