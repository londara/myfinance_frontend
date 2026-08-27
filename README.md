# MyFinance — Desktop Dashboard

A Next.js implementation of the MyFinance dashboard designs in
[`../stitch_myfinance_desktop_dashboard_ux_ui/`](../stitch_myfinance_desktop_dashboard_ux_ui/).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — the design tokens live in `@theme` in [src/app/globals.css](src/app/globals.css)
- **shadcn/ui** (radix base) — primitives in [src/components/ui/](src/components/ui/)
- **Recharts** for the charts, wrapped by shadcn's `ChartContainer`
- **lucide-react** for icons
- **next-themes** for the light / dark / system toggle

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Routes

| Route           | Screen                                              |
| --------------- | --------------------------------------------------- |
| `/`             | Dashboard overview                                  |
| `/transactions` | Ledger with search / date / category filters         |
| `/budgets`      | Total budget health + per-category cards            |
| `/goals`        | Goal board with a ghost "add" card                  |
| `/reminders`    | Month calendar + grouped upcoming payments          |
| `/reports`      | Net worth, spending trend, cashflow, top categories |
| `/settings`     | Profile, linked accounts, notifications, security   |
| `/login`        | Sign in                                             |
| `/register`     | Create account                                      |

All four modals from the designs are implemented and reachable from their pages:
Add Transaction (top bar, every page), Create New Budget, Add New Goal, Create
New Reminder.

## Backend integration

The app talks to the Spring API in [`../backend`](../backend). Start both:

```bash
cd ../backend && mvn spring-boot:run   # :8080
cd ../web     && npm run dev           # :3000
```

`BACKEND_URL` in `.env.local` points at the API — see [`.env.example`](.env.example). It is **not**
`NEXT_PUBLIC_`, because the browser never calls the backend directly.

Outside development it is **required**: a missing `BACKEND_URL` fails the build with a message
naming the variable rather than falling back to `localhost:8080`, where nothing on a deployed
container is listening. That fallback was a trap — it makes a broken deploy look like a mysterious
`ECONNREFUSED 127.0.0.1:8080` for a URL nobody configured.

### How data flows

| Concern | Mechanism | Where |
| --- | --- | --- |
| Session | httpOnly cookie, set by a Server Action | [lib/api/session.ts](src/lib/api/session.ts) |
| Reads | Server Components calling the API server-to-server | [lib/api/queries.ts](src/lib/api/queries.ts) |
| Writes | Server Actions + `revalidatePath` | [lib/actions/](src/lib/actions/) |
| Filters | URL search params, so the server re-renders | [transactions/page.tsx](<src/app/(app)/transactions/page.tsx>) |
| Route guard | `proxy.ts` (Next 16 renamed `middleware.ts`) | [src/proxy.ts](src/proxy.ts) |
| Live notifications | SSE through a same-origin route proxy | [api/notifications/stream](src/app/api/notifications/stream/route.ts) |
| Excel export | `.xlsx` piped through a route proxy | [api/transactions/export](src/app/api/transactions/export/route.ts) |

### Four decisions worth knowing

**The token is in an httpOnly cookie, never `localStorage`.** A bearer token in `localStorage` is
readable by any script that reaches the page — one XSS and an attacker has a 30-day session. The
consequence shapes everything else: the browser cannot read the token, so every backend call has to
originate on the server. There is no client-side `fetch` to :8080 anywhere, and CORS never applies.

**Nothing is cached in Next.** Every API call is `cache: no-store`. Next's Data Cache is keyed by
URL, and every user hits the same `/api/dashboard` — caching there risks serving one user's balances
to another. That is a data leak, not a slow page, and no amount of tag discipline fixes a key that
omits the tenant. Caching happens in the backend's Redis instead, keyed per user.

**Filters live in the URL.** `?search=coffee&page=2` re-renders the Server Component against a new
backend query, so a filtered view is shareable, bookmarkable, survives a refresh and works with the
back button. `useState` would have needed a client data layer and given up all four.

**The Export button downloads a real `.xlsx`, not JSON.** The backend keeps its streamed
NDJSON endpoint for API clients — it is the clearest example of an incremental `Flux` — but a
`.jsonl` file is not something anyone can open. The workbook is built by Apache POI on the
backend, where the data already is, and piped through the route proxy unbuffered. Building it
in this Next process instead would have meant holding the whole thing in the heap of the
smaller of the two services.

**Two route handlers exist only to attach the credential.** `EventSource` cannot set an
`Authorization` header, and neither can a plain download navigation. Both proxies read the httpOnly
cookie server-side and **pipe** the upstream body without buffering — reading it into memory would
undo the streaming the backend does specifically to keep a large export off the heap.

## Design system

[`../stitch_myfinance_desktop_dashboard_ux_ui/myfinance/DESIGN.md`](../stitch_myfinance_desktop_dashboard_ux_ui/myfinance/DESIGN.md)
is the source of truth. It is encoded once, in `globals.css`:

- **Palette** — Deep Slate `#1E293B` primary on a `#F7F9FB` canvas; white cards.
  shadcn's tokens (`--primary`, `--card`, `--border`, …) are remapped to it, so
  every shadcn component is on-brand without per-component overrides.
- **Type scale** — `text-headline-md`, `text-title-md`, `text-label-md`, … as
  named font-size steps. `cn()` in [src/lib/utils.ts](src/lib/utils.ts) teaches
  tailwind-merge about them so a size and a color class never clobber each other.
- **Money** — `.tnum` enables tabular figures so currency columns align.
- **Elevation** — `.fin-card` (Level 1) and `--shadow-level-2` (modals).
- **Shape** — 8px controls, 16px cards (`rounded-card`).

### Light and dark

Every color is a plain custom property under `:root`, restated under `.dark`;
`@theme inline` only maps them to utility names. No component hardcodes a hex, so
both themes come from one place. The dark set is *selected* for the dark surface
rather than inverted from light — including the chart steps, which were
re-validated against the dark card. `next-themes` drives the `.dark` class; the
picker lives in the top app bar (Light / Dark / System) and on the auth pages as a
two-state flip. Its icon swaps via the `dark:` variant rather than JS, so there is
no hydration guard and no first-paint flash.

### Auth pages

`/login` and `/register` are not in the source exports — they are derived from
`DESIGN.md`. A solid Deep Slate brand panel (the only one in the app) carries the
identity before the product chrome exists; it collapses below `lg`, and in dark
mode it takes its own lifted tone so the split still reads against the canvas.

Both forms validate on the client — email shape, password strength, confirm match,
terms accepted — then route to the dashboard. **There is no auth backend**: wire
the submit handlers in [src/components/auth/](src/components/auth/) to a real
provider, and the Google buttons in `social-auth.tsx` along with them.

### Where the sources disagreed

The exported screens were not consistent with each other. Each conflict was
resolved once, in favour of the dashboard screen and `DESIGN.md`:

- **Sidebar** — the dashboard's version (square `M` mark, `title-md` labels,
  active item on the low surface with a 4px right border) is used everywhere.
  The Settings export had no sidebar at all; it now has one.
- **Top app bar** — one bar for every route: page title + subtitle on the left,
  `Add Transaction` / notifications / avatar on the right. Pages no longer repeat
  their own `<h1>`.
- **Modals** — all four share one chrome (`FormDialogContent`): bordered header,
  scrolling body, footer on the low surface with Cancel + primary action.
- **Progress tones** — monotonic Green → Yellow → Red per `DESIGN.md`, rather
  than the per-screen mix (the budgets export painted 100% green and 81% yellow).
- **Ledger amounts** — debits red, credits green, always with an explicit sign.
- **Chart color** — single-series charts use the brand ink. The categorical
  palette (`src/lib/viz.ts`) replaces the ad-hoc blue/red/yellow with a
  fixed-order set validated for colorblind separation and contrast; every slot
  is also directly labelled, so nothing depends on color alone.

## Data

[src/lib/data.ts](src/lib/data.ts) holds the demo dataset transcribed from the
designs. Swap that module for API calls to wire up a backend — nothing else
reads from it directly.

## Deploying

See **[docs/DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md)** for the step-by-step Render runbook.

Short version: a **Node** service, `npm ci --include=dev && npm run build` / `npm start`, no Root Directory (this
repository's root is the app), health check `/api/health`, and one environment variable —
`BACKEND_URL`. [`render.yaml`](render.yaml) declares all of it if you deploy as a Blueprint.

**`tailwindcss`, `@tailwindcss/postcss`, `typescript` and the `@types/*` packages are in `dependencies`,
not `devDependencies`, on purpose.** Render sets `NODE_ENV=production` for the build, npm reads
that as `omit=dev`, and `npm ci` then prunes 246 packages — including everything `next build`
runs. The build fails on `Cannot find module '@tailwindcss/postcss'`, which looks like a
missing dependency rather than a pruned one. Moving them is the only fix that does not depend on a
Build Command typed into a web form. Please do not move them back. `eslint` stays dev-only,
because `next build` does not lint.

The health endpoint deliberately does **not** call the backend: a liveness check that depends on
another service lets that service's downtime take this one with it, when in fact every static page
still renders.
