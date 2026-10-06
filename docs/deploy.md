# Deploying Picky on Vercel

Picky deploys as three Vercel projects built from this one repo, plus the browser extension,
which is published to the Chrome Web Store instead.

| Project         | Root directory | What it is                                  |
| --------------- | -------------- | ------------------------------------------- |
| `picky-api`     | `apps/api`     | Hono API on the Bun runtime (Fluid compute) |
| `picky-web`     | `apps/web`     | Vite SPA: library and spec sheets           |
| `picky-landing` | `apps/landing` | Vite static landing page                    |

## How products get in

- **Default: DOM capture only.** The extension reads the product page in the user's browser and
  posts a snapshot to `POST /api/snapshots`. No scraping service is needed.
- **Optional: URL import through Firecrawl.** This is off unless the API has `FIRECRAWL_API_KEY`
  (hosted Firecrawl at `api.firecrawl.dev`) or `FIRECRAWL_URL` (a self-hosted instance).
  - When off, `POST /api/imports` returns **501** with a message pointing to the extension.
  - `GET /api/capabilities` returns `{ "urlImport": false }`. The web app reads it before the first
    render and greys out its paste-a-link fields.
  - Setting the key on the API project and redeploying turns import back on. The web project needs
    no change.

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
PICKY_API_URL=https://<api domain> PICKY_WEB_URL=https://<web domain> bun run build:extension
```

The build derives the manifest's `host_permissions` from `PICKY_API_URL`.

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
  - The hero's paste-a-link form opens the web app with `?import=`. With URL import off, the web
    app ignores the link, so hide or reword the form for a DOM-capture-only launch.
  - "Add to Chrome" points to `#how` until `VITE_PICKY_EXTENSION_URL` is set, which needs the store
    listing.
  - "Open app" silently falls back to `http://localhost:5173` if `VITE_PICKY_WEB_URL` is missing.
  - The page has no favicon and no `og:` or `twitter:` preview tags.
- **Bun 1.4.x is in beta on Vercel.** If something breaks, set `bunVersion` to `"1.x"` (Bun 1.3).
- **Scrape duration:** a Firecrawl scrape takes about 5 seconds and may take up to 90, which fits
  within Vercel's default 300-second function limit.
