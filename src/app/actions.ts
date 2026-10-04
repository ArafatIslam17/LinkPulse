"use server";

import { revalidatePath } from "next/cache";
import { AliasTakenError, createLink, deleteOwnedLink, type LinkSummary } from "@/lib/links";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  ensureOwnerId,
  getBaseUrl,
  getClientFingerprint,
  getHost,
  getOwnerId,
} from "@/lib/request-context";
import { normalizeCode, validateAlias, validateDestinationUrl } from "@/lib/validation";

export type CreateLinkState =
  | { status: "idle" }
  | { status: "error"; field: "url" | "alias" | "form"; message: string; values: { url: string; alias: string } }
  | { status: "success"; link: LinkSummary; shortUrl: string };

export async function createLinkAction(_prev: CreateLinkState, formData: FormData): Promise<CreateLinkState> {
  const rawUrl = String(formData.get("url") ?? "");
  const rawAlias = String(formData.get("alias") ?? "");
  const values = { url: rawUrl, alias: rawAlias };

  const url = validateDestinationUrl(rawUrl, await getHost());
  if (!url.ok) return { status: "error", field: "url", message: url.error, values };

  const alias = validateAlias(rawAlias);
  if (!alias.ok) return { status: "error", field: "alias", message: alias.error, values };

  try {
    const allowed = await consumeRateLimit(await getClientFingerprint());
    if (!allowed) {
      return {
        status: "error",
        field: "form",
        message: "You're creating links too quickly. Wait a few minutes and try again.",
        values,
      };
    }

    const ownerId = await ensureOwnerId();
    const link = await createLink({ originalUrl: url.value, ownerId, alias: alias.value });
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { status: "success", link, shortUrl: `${await getBaseUrl()}/${link.shortCode}` };
  } catch (error) {
    if (error instanceof AliasTakenError) {
      return {
        status: "error",
        field: "alias",
        message: `"${alias.value}" is already taken. Try another alias.`,
        values,
      };
    }
    console.error("createLinkAction failed", error);
    return { status: "error", field: "form", message: "The link couldn't be created. Try again.", values };
  }
}

export async function deleteLinkAction(shortCode: string): Promise<{ ok: boolean; message?: string }> {
  const code = normalizeCode(shortCode);
  const ownerId = await getOwnerId();
  if (!code || !ownerId) return { ok: false, message: "That link wasn't found." };

  try {
    const deleted = await deleteOwnedLink(ownerId, code);
    if (!deleted) return { ok: false, message: "That link wasn't found." };
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("deleteLinkAction failed", error);
    return { ok: false, message: "The link couldn't be deleted. Try again." };
  }
}
