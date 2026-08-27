# Deploying the frontend to Render

The backend has its own runbook (`backend/docs/DEPLOY-RENDER.md`) and its own
repository. This covers this Next.js app only.

> Render's UI and free-tier policies change. Where this says "check the current
> plan limits", do — the numbers move.

---

## What is already done

| Piece | Where | Why it matters |
| --- | --- | --- |
| `render.yaml` | [`../render.yaml`](../render.yaml) | The whole deploy as reviewable config instead of a web form. Optional — the dashboard works too. |
| Health endpoint | [`../src/app/api/health/route.ts`](../src/app/api/health/route.ts) | Answers `/api/health` **without calling the backend**, so the backend sleeping cannot make Render judge this service unhealthy. |
| `BACKEND_URL` is required | [`../src/lib/api/client.ts`](../src/lib/api/client.ts) | Forgetting it fails the **build** with a message naming the variable, rather than silently targeting the container's own `localhost:8080`. |
| Node pinned | [`../.node-version`](../.node-version) | 22. Without it a platform upgrade changes the runtime under you between deploys. |
| `.env.example` committed | [`../.env.example`](../.env.example) | The default Next `.gitignore` has `.env*`, which hides the example too. Now un-ignored — it is the only record of what a deploy needs. |
| `next start` reads `PORT` | `package.json` | No `-p` flag: `next start` honours `process.env.PORT` on its own, and a `${PORT:-3000}` shell default in an npm script would break on Windows. |

Nothing here needs a Dockerfile. The backend needs one because Render's non-Java
build images have no JDK; a Node service has Node.

---

## Step 1 — Push this repository

This app is its own repository (`myfinance_frontend`), and its **root is the
Next.js app** — so there is no Root Directory to set, unlike the backend.

```bash
cd d:/PROJECT/MyFinanceDashboard/web
git add -A
git status --short

# Must print nothing — .env.local holds no secrets today, but keep it that way:
git diff --cached --name-only | grep -x ".env.local"

git commit -m "Prepare for Render: health check, required BACKEND_URL, blueprint"
git push origin main
```

---

## Step 2 — Create the service

### Option A — Blueprint (uses `render.yaml`)

Render dashboard → **New +** → **Blueprint** → pick this repository. Every
setting below is read from [`../render.yaml`](../render.yaml). Confirm the
`BACKEND_URL` value it shows is the backend you actually want.

### Option B — By hand

Render dashboard → **New +** → **Web Service** → connect this repository.

| Setting | Value |
| --- | --- |
| Language | **Node** |
| Region | **Same as the backend** (Oregon, if you kept the default) |
| Branch | `main` |
| Root Directory | *(leave empty — the repo root is the app)* |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

`npm ci` rather than `npm install`: it installs exactly what
`package-lock.json` pins and fails if the lockfile and `package.json` disagree,
so a deploy cannot quietly resolve a different dependency tree than the one you
tested.

**Region matters.** Every page render makes server-to-server calls to the
backend, so a cross-region hop is paid on *every request*, not once.

---

## Step 3 — Environment variables

Service → **Environment**:

| Key | Value |
| --- | --- |
| `BACKEND_URL` | `https://myfinance-backend-aidt.onrender.com` |
| `NODE_VERSION` | `22` |

`PORT` is injected by Render. Do not set it.

`BACKEND_URL` must be present **at build time**, not just at runtime — Next
evaluates it while collecting route configuration. Render exposes environment
variables to the build, so this works; but it does mean a missing variable fails
the build rather than the first request:

```
Error: Failed to collect configuration for /budgets
  [cause]: Error: BACKEND_URL is not set. Point it at the Spring Boot API, e.g.
           BACKEND_URL=https://myfinance-backend-aidt.onrender.com
```

That is the intended behaviour. The earliest possible failure with the variable
named in it beats a service that boots and then renders errors.

### There is no `NEXT_PUBLIC_` variable, and that is deliberate

`BACKEND_URL` is server-side only. The browser never calls the backend: reads
happen in Server Components, writes in Server Actions, and the two streams go
through route handlers in `src/app/api/`. The bearer token lives in an httpOnly
cookie the browser cannot read.

Two consequences worth knowing:

- **There is no CORS configuration to do.** Server-to-server requests are not
  subject to it. If you find yourself editing CORS, something has moved to the
  client that should not have.
- **The backend URL never reaches the browser.** Renaming it to
  `NEXT_PUBLIC_BACKEND_URL` would publish it and break that property.

---

## Step 4 — Deploy and check

Watch **Logs** for:

```
✓ Compiled successfully
▲ Next.js 16.3.3
- Local:  http://localhost:10000
✓ Ready in 1.1s
```

The port is whatever Render assigned — seeing it here confirms `PORT` resolved.

```bash
BASE=https://<your-web-service>.onrender.com

curl -s $BASE/api/health                                    # {"status":"UP"}
curl -s -o /dev/null -w "%{http_code}\n" $BASE/login        # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" $BASE/   # 307 -> /login
```

`/` redirecting to `/login` for a visitor with no cookie is the route guard in
[`../src/proxy.ts`](../src/proxy.ts) working, not an error.

Then register through the UI. The backend's `render` profile has the demo seeder
**off**, so there is no `jane.doe@example.com` on the deployed instance —
registration seeds 19 default categories for the new account.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails: `BACKEND_URL is not set` | The variable is missing from the service environment | Add it. This failure is deliberate — see step 3 |
| Build fails in `npm ci`: lockfile out of sync | `package.json` was edited without updating `package-lock.json` | Run `npm install` locally, commit the lockfile |
| Every page shows an error; logs show `ECONNREFUSED 127.0.0.1:8080` | An older build with the `localhost` fallback still deployed | Redeploy. The fallback now only applies outside production |
| First page load takes ~50s, then works | The **backend** free instance was asleep and had to cold start | Expected. Paid backend, or accept it |
| Pages time out rather than eventually loading | Backend cold start exceeded Render's request timeout | Hit the backend's `/actuator/health` first to wake it, then retry |
| Login succeeds but every page bounces back to `/login` | Cookie rejected. `secure: true` is set in production, which needs HTTPS | Use the `https://` URL, not `http://` |
| Notification bell shows "Reconnecting" | The SSE stream dies when either free instance spins down | Expected. `EventSource` reconnects on its own |
| Health check passes but the app is broken | `/api/health` does not call the backend, on purpose | Check the backend's own `/actuator/health` separately |

---

## Free tier, honestly

**Two** free services now spin down independently, and the interesting case is
the frontend being awake while the backend is asleep: the health check still
passes, `/login` renders instantly from static output, and then the first
authenticated page render blocks ~50s waiting for the backend. It looks like the
frontend is broken when it is not.

A cheap mitigation is to wake the backend before you demo it:

```bash
curl -s https://myfinance-backend-aidt.onrender.com/actuator/health
```

Also inherited from the backend's plan: `@Scheduled` jobs do not run while it
sleeps, so the notification scan and the nightly balance snapshot are skipped —
which is why the net-worth chart stays sparse on a free instance.
