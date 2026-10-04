# Hopline

A URL shortener with click analytics. Paste a long link, get a short one (random or a custom alias), share it, and see how it's used: clicks over time, referrers, devices, browsers, operating systems and countries.

It's a single Next.js app with a Postgres database, built to deploy on Vercel.

## Features

- Shorten any http/https URL, with an optional custom alias (`/myportfolio`)
- Fast 302 redirects; clicks are written after the response is sent
- Dashboard with totals (links, clicks, today, this week, this month) and a searchable list of links
- Per-link analytics for the last 24 hours, 7 days, 30 days or all time
- Copy, open, view analytics and delete (with confirmation) from the dashboard
- Responsive layouts: the links table becomes cards on phones, charts and controls resize for touch
- Light and dark themes follow the system setting

### Privacy

- Raw IP addresses are never stored. Country comes from Vercel's `x-vercel-ip-country` header.
- Referrers are reduced to the hostname (no paths or query strings).
- Bots and link-preview crawlers (Slack, WhatsApp, Twitter, curl and similar) are redirected but not counted.
- Rate limiting uses a salted hash of the IP, kept for at most a day.

### Ownership

There are no accounts yet. Each browser gets an anonymous id in an httpOnly cookie, and the dashboard shows the links created in that browser. Other browsers can use the short links but can't see their analytics or delete them. To add real authentication later, change `getOwnerId()` and `ensureOwnerId()` in `src/lib/request-context.ts` to return the signed-in user's id; the rest of the app already filters by owner.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Actions, Route Handlers), React 19, TypeScript |
| Styling | Tailwind CSS 4, Geist font (bundled, no external requests) |
| Database | PostgreSQL (Neon recommended), Drizzle ORM, `pg` driver |
| Charts | Recharts |
| Other | `ua-parser-js` (device/browser/OS), `sonner` (toasts), `lucide-react` (icons), `@vercel/functions` (connection pool lifecycle) |

## Project structure

```
src/
  app/
    [code]/route.ts          redirect endpoint: looks up the code, records the click, 302s
    page.tsx                 home page with the shorten form
    actions.ts               server actions: create and delete links
    dashboard/(overview)/    dashboard overview and links list
    dashboard/[code]/        analytics for one link
  components/                UI components (form, table, charts, dialogs)
  db/                        Drizzle schema and pooled connection
  lib/
    analytics.ts             aggregation queries (periods, trend buckets, breakdowns)
    links.ts                 link data access
    validation.ts            URL and alias validation, reserved words
    rate-limit.ts            Postgres-backed rate limiter
    request-context.ts       owner cookie, timezone, base URL, client fingerprint
drizzle/                     SQL migrations (committed)
scripts/migrate.mjs          applies migrations
```

## Environment variables

Copy `.env.example` to `.env` and fill it in.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. On Neon, use the pooled URL. |
| `DATABASE_URL_UNPOOLED` | No | Direct connection used only for migrations. Set automatically by the Neon integration. |
| `HASH_SALT` | Recommended | Secret salt for rate-limit keys. Any long random string. |
| `NEXT_PUBLIC_APP_URL` | No | Forces the origin used in short links, such as a custom domain. By default the request's host is used, so preview and production deployments each produce their own correct URLs. |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS` | No | Links a visitor can create per window. Default 20 per 600 seconds. |
| `DATABASE_POOL_MAX` | No | Max connections per server instance. Default 5. |

## Run locally

Requirements: Node.js 20 or newer and a Postgres database (local Postgres, Docker, or a free Neon project).

```bash
npm install
cp .env.example .env          # then set DATABASE_URL
npm run db:migrate            # creates the tables
npm run dev                   # http://localhost:3000
```

A quick local database with Docker:

```bash
docker run -d --name hopline-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hopline postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hopline
```

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:studio` | Browse the database with Drizzle Studio |

## Database

Three tables:

- `links`: short code (unique), destination, owner, custom flag, denormalized click count and last click time
- `clicks`: one row per counted click with timestamp, referrer host, country, device, browser and OS; indexed on `(link_id, created_at)` and `created_at`
- `rate_limits`: fixed-window counters for link creation

Analytics are computed in SQL. Period counts use `COUNT(*) FILTER`, the trend chart uses `generate_series` to fill empty buckets, and all five breakdowns come from a single `GROUPING SETS` scan. "Today", "this week" (starting Monday) and "this month" use the viewer's timezone, which the browser stores in a cookie.

Migrations live in `drizzle/` and are tracked in the `drizzle.__drizzle_migrations` table, so running `npm run db:migrate` repeatedly is safe.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository. The framework is detected as Next.js.
3. Add a database. The simplest route is **Storage → Create Database → Neon** in the Vercel project, which sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you. If you use an existing Postgres instead, add `DATABASE_URL` under **Settings → Environment Variables**.
4. Add `HASH_SALT` with a random value (`openssl rand -hex 32`).
5. Deploy.

`vercel.json` sets the build command to `npm run vercel-build`, which runs the database migrations and then `next build`. No manual SQL is needed, and redeploys only apply new migrations.

To use a custom domain, add it in Vercel. Short links pick up the domain automatically; set `NEXT_PUBLIC_APP_URL` only if you want every deployment to print links on one fixed domain.

## Notes and limits

- Country data only appears on Vercel (or another host that sends `x-vercel-ip-country`). Locally it shows as Unknown.
- Clearing cookies loses access to the dashboard for previously created links. The links keep working.
- Short codes and aliases are case-insensitive and stored lowercase.
