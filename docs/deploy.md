# Deploying Picky on Vercel

Picky deploys as three Vercel projects built from this one repo, plus the browser extension,
which is published to the Chrome Web Store instead.

| Project         | Root directory | What it is                                  |
| --------------- | -------------- | ------------------------------------------- |
| `picky-api`     | `apps/api`     | Hono API on the Bun runtime (Fluid compute) |
| `picky-web`     | `apps/web`     | Vite SPA: library and spec sheets           |
| `picky-landing` | `apps/landing` | Vite static landing page                    |

## How products get in

Everything goes through the extension, so no scraping service is needed:

- **On a product page** (toolbar, Quick Look, right-click on the page → "Add to Picky"): the extension
  reads the open page's DOM and posts a snapshot to `POST /api/snapshots`.
- **From a link** (Alt+click, right-click on a link → "Picky ▸ Add to …", or the web app's
  paste-a-link field): the extension downloads the page with the user's cookies, parses it in an
  offscreen document with the same extractor, and posts the snapshot to `POST /api/snapshots`. The
  web app talks to the extension through a content script on its own origin (`PICKY_WEB_URL` at
  extension build time) and greys out paste-a-link when the extension is not installed.
  "Picky ▸ Quick Look" on a link reads it the same way but only shows its specs, saving nothing.
- **Unused: URL import through Firecrawl** (`POST /api/imports`, `GET /api/capabilities`). It is still
  wired when `FIRECRAWL_API_KEY` or `FIRECRAWL_URL` is set, but no client calls it any more.

## What's already in the repo

- `apps/api/src/index.ts`: the Vercel entry point. Vercel's Hono preset detects it and serves its
  default export. It does not run migrations, so new instances starting together can't race on them.
- `apps/api/src/main.ts`: the long-running server for local dev. It still migrates on start.
- `apps/api/src/compose-api.ts`: the app wiring both entry points share. It loads the Laya
  decision model (onnxruntime) only when `DECISION_MODEL_DIR` is set, and it isn't set on Vercel.
- `apps/api/scripts/migrate.ts`: `bun run db:migrate`, which runs as the API's build command.
- `apps/api/vercel.json`: Hono preset, `bunVersion: "1.4.x"`, migrations as the build command.
- `apps/web/vercel.json`: forwards `/api/*` to the API project and serves `index.html` for every
  other path so deep links work. The browser sees one origin, so there's no CORS.
- `apps/landing/vercel.json`: Vite preset.

## Steps

### 1. Database

Add **Neon Postgres** from the Vercel Marketplace and attach it to `picky-api`. That sets
`DATABASE_URL`.

Turn on Neon's per-preview database branches. Migrations run on every build, so without them
preview deployments would migrate the production database.

### 2. Create the three projects

Import the repo three times and set each project's **Root Directory** from the table above. Leave
**"Include files outside the root directory"** on, so the shared `packages/*` workspaces build.

Environment variables:

| Project         | Variable                   | Value                                          |
| --------------- | -------------------------- | ---------------------------------------------- |
| `picky-api`     | `DATABASE_URL`             | From the Neon integration                      |
| `picky-api`     | `WEB_ORIGIN`               | `https://<web domain>`                         |
| `picky-api`     | `FIRECRAWL_API_KEY`        | Optional; turns on URL import                  |
| `picky-web`     | `VITE_PICKY_EXTENSION_URL` | Chrome Web Store listing                       |
| `picky-landing` | `VITE_PICKY_WEB_URL`       | `https://<web domain>` (defaults to localhost) |
| `picky-landing` | `VITE_PICKY_EXTENSION_URL` | Chrome Web Store listing (defaults to `#how`)  |

Never put the Firecrawl key in a `VITE_*` variable: those are bundled into public JavaScript.

### 3. Deploy the API first

Check that `https://<api domain>/health` returns `{"status":"ok"}`, and that
`https://<api domain>/api/capabilities` reports what you expect.

### 4. Point the web app at the API

`apps/web/vercel.json` forwards `/api/*` to `https://picky-api.vercel.app`. Vercel doesn't allow
environment variables in rewrites, so if the API's domain is different, edit that line and commit.

### 5. Deploy web, then landing

### 6. Build the extension for production

The extension isn't hosted on Vercel. Build it against the deployed stack and upload `dist/` to the
Chrome Web Store:

```sh
PICKY_WEB_URL=https://<web domain> bun run build:extension
```

Leave `PICKY_API_URL` unset. The extension then calls `/api` through the web domain (which forwards it
to the API), so it sends the web app's session cookie and is signed in exactly when the web app is.
Pointing it straight at the API domain would leave it signed out. The build derives the manifest's
`host_permissions` from that API origin.

### Accounts

- Saving products and comparisons needs an account; reading specs in the extension does not.
- Migration `003_add_users.sql` deletes every product and comparison saved before accounts existed,
  because they have no owner. It runs on the next API build.
- To create a login, run `bun run user:create [email] [file]` with `DATABASE_URL` pointing at the
  target database. It writes the generated password to a git-ignored `*.credentials.json` file.

### 7. Custom domains (optional)

If you add domains such as `picky.in`, `app.picky.in` and `api.picky.in`, update `WEB_ORIGIN`,
the rewrite in `apps/web/vercel.json`, the landing variables and the extension build to match.

## Continuous deployment

`feat/vercel-deploy` is the deployment branch. Every push to it runs `.github/workflows/deploy.yml`:

1. **verify**: typecheck and the full test suite, including the Postgres integration tests against a
   throwaway Postgres service.
2. **deploy-api**: `vercel deploy --prod` for `picky-api`. Its build applies migrations first.
3. **deploy-frontends**: `picky-web` and `picky-landing` in parallel, after the API is live.

Rollouts run one at a time (`concurrency: production-deploy`), so two pushes never migrate at once.
The Vercel projects aren't connected to Git, so this workflow is the only thing that deploys them.

GitHub setup, in the `production` environment (only `feat/vercel-deploy` may deploy to it):

| Kind     | Name                        | Value                                                 |
| -------- | --------------------------- | ----------------------------------------------------- |
| Secret   | `VERCEL_TOKEN`              | A token from https://vercel.com/account/tokens        |
| Variable | `VERCEL_ORG_ID`             | `orgId` in `.vercel/project.json` after `vercel link` |
| Variable | `VERCEL_API_PROJECT_ID`     | `vercel project inspect picky-api`                    |
| Variable | `VERCEL_WEB_PROJECT_ID`     | `vercel project inspect picky-web`                    |
| Variable | `VERCEL_LANDING_PROJECT_ID` | `vercel project inspect picky-landing`                |

## Before launch

- **Landing page:**
  - The hero's paste-a-link form opens the web app with `?import=`. Without the extension the web
    app ignores the link, so hide or reword the form for visitors who have not installed it.
  - "Add to Chrome" points to `#how` until `VITE_PICKY_EXTENSION_URL` is set, which needs the store
    listing.
  - "Open app" silently falls back to `http://localhost:5173` if `VITE_PICKY_WEB_URL` is missing.
  - The page has no favicon and no `og:` or `twitter:` preview tags.
- **Bun 1.4.x is in beta on Vercel.** If something breaks, set `bunVersion` to `"1.x"` (Bun 1.3).
