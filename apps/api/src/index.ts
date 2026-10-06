import type { Hono } from "hono";
// @ts-ignore -- dist/ only exists after `bun run build:vercel` (the Vercel build command).
import bundledApp from "../dist/vercel-app.js";

// Vercel entrypoint. Its Hono preset needs this file to import "hono", and it compiles each .ts file
// separately without rewriting our `./x.ts` import specifiers, so it serves a single bundled file instead.
const app: Hono = bundledApp;

export default app;
