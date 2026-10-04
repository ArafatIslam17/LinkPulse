import { siteConfig } from "./config";

/**
 * Standalone 404 page for unknown short codes. The redirect endpoint is a route handler
 * (for speed and exact status codes), so it serves this self-contained HTML instead of
 * a React page. Visual style mirrors src/app/not-found.tsx.
 */
export function linkNotFoundPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Link not found · ${siteConfig.name}</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
  :root { --bg:#f3f5f9; --surface:#fff; --ink:#131a2e; --muted:#5d6680; --line:#dfe3ec; --route:#2346e8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0d1222; --surface:#151c31; --ink:#e8ebf4; --muted:#98a1ba; --line:#262f48; --route:#7d93ff; }
  }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
    background:var(--bg); color:var(--ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 440px; }
  .mark { display:flex; align-items:center; gap:8px; font-weight:600; margin-bottom:40px; color:var(--ink); text-decoration:none; }
  .dot { width:22px; height:22px; border-radius:7px; background:var(--route); }
  h1 { font-size: 30px; line-height: 1.15; letter-spacing:-0.02em; margin: 0 0 12px; }
  p { color: var(--muted); line-height: 1.6; margin: 0 0 28px; }
  a.btn { display:inline-flex; align-items:center; min-height:44px; padding:0 18px; border-radius:10px;
    background:var(--route); color:#fff; text-decoration:none; font-weight:600; }
  a.btn:focus-visible { outline: 3px solid var(--route); outline-offset: 3px; }
</style>
</head>
<body>
<main>
  <a class="mark" href="/"><span class="dot" aria-hidden="true"></span>${siteConfig.name}</a>
  <h1>This short link doesn't exist</h1>
  <p>It may have been mistyped, or the person who created it deleted it. Check the address and try again.</p>
  <a class="btn" href="/">Create a short link</a>
</main>
</body>
</html>`;
}
