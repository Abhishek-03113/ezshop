import { cp, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { apiHostPermission, resolveCaptureConfig } from "./src/capture-config.ts";

// Builds the unpacked extension into dist/. Load it via chrome://extensions → "Load unpacked".
// EZSHOP_API_URL / EZSHOP_WEB_URL point it at a non-local stack.
const OUT_DIR = join(import.meta.dir, "dist");
const config = resolveCaptureConfig(Bun.env);

// The service worker is an ES module (manifest "type": "module"); files given to
// chrome.scripting.executeScript must be classic scripts, hence IIFE.
const BUNDLES = [
  { entry: "src/background.ts", name: "background.js", format: "esm" },
  { entry: "src/page-capture-entry.ts", name: "page-capture.js", format: "iife" },
  { entry: "src/popup/popup-entry.ts", name: "popup.js", format: "iife" },
] as const;

async function buildBundle(bundle: (typeof BUNDLES)[number]): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, bundle.entry)],
    target: "browser",
    format: bundle.format,
    naming: bundle.name,
    outdir: OUT_DIR,
    define: { __EZSHOP_CAPTURE_CONFIG__: JSON.stringify(config) },
  });
  if (!result.success) throw new AggregateError(result.logs, `Bundling ${bundle.entry} failed`);
}

// popup.html links one stylesheet: the shared design tokens followed by the popup's own rules.
async function writePopupStylesheet(): Promise<void> {
  const tokensPath = fileURLToPath(import.meta.resolve("@ezshop/ui-tokens/tokens.css"));
  const popupCss = await Bun.file(join(import.meta.dir, "src/popup/popup.css")).text();
  await Bun.write(join(OUT_DIR, "popup.css"), `${await Bun.file(tokensPath).text()}\n${popupCss}`);
}

async function writeManifest(): Promise<void> {
  const manifest = await Bun.file(join(import.meta.dir, "public/manifest.json")).json();
  manifest.host_permissions = [apiHostPermission(config)];
  await Bun.write(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

await rm(OUT_DIR, { recursive: true, force: true });
await Promise.all(BUNDLES.map(buildBundle));
await cp(join(import.meta.dir, "public"), OUT_DIR, { recursive: true });
await writeManifest();
await writePopupStylesheet();
console.log(`Extension built to ${OUT_DIR} for API ${config.apiBaseUrl}, web ${config.webBaseUrl}`);
