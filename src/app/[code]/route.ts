import { after, NextResponse, type NextRequest } from "next/server";
import { findRedirectTarget, recordClick } from "@/lib/links";
import { linkNotFoundPage } from "@/lib/not-found-html";
import { isBot, parseUserAgent, referrerHost } from "@/lib/user-agent";
import { normalizeCode } from "@/lib/validation";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

async function resolve(request: NextRequest, code: string, countClick: boolean) {
  const shortCode = normalizeCode(code);
  const target = shortCode ? await findRedirectTarget(shortCode) : null;

  if (!target) {
    return new NextResponse(linkNotFoundPage(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8", ...NO_STORE },
    });
  }

  const userAgent = request.headers.get("user-agent");
  if (countClick && !isBot(userAgent)) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const referrer = referrerHost(request.headers.get("referer"), host);
    const countryHeader = request.headers.get("x-vercel-ip-country");
    const country = countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
    const { device, browser, os } = parseUserAgent(userAgent);

    // Write analytics after the response is sent so the redirect isn't delayed.
    after(async () => {
      try {
        await recordClick({ linkId: target.id, referrer, country, device, browser, os });
      } catch (error) {
        console.error("Failed to record click", error);
      }
    });
  }

  return NextResponse.redirect(target.originalUrl, { status: 302, headers: NO_STORE });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return resolve(request, (await params).code, true);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return resolve(request, (await params).code, false);
}
