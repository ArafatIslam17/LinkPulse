"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Stores the browser's timezone in a cookie so "today" and "this week" are computed
 * on the viewer's calendar rather than the server's. Refreshes once if it changed.
 */
let refreshed = false;

export function TimezoneSync({ serverTimeZone }: { serverTimeZone: string }) {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const current = document.cookie.match(/(?:^|; )hl_tz=([^;]*)/)?.[1];
    if (!current || decodeURIComponent(current) !== tz) {
      document.cookie = `hl_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    }
    // Only re-render when the page was computed for a different timezone, and only once,
    // so a timezone the server doesn't recognize can't cause a refresh loop.
    if (serverTimeZone !== tz && !refreshed) {
      refreshed = true;
      router.refresh();
    }
  }, [router, serverTimeZone]);
  return null;
}
