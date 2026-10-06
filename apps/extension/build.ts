import { cp, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildShadowStylesheet } from "./src/quicklook/shadow-css.ts";
import { mergeHostPermissions } from "./src/host-permissions.ts";
import { apiHostPermission, resolveCaptureConfig } from "./src/capture-config.ts";

// Builds the unpacked extension into dist/. Load it via chrome://extensions → "Load unpacked".
// PICKY_API_URL / PICKY_WEB_URL point it at a non-local stack.
const OUT_DIR = join(import.meta.dir, "dist");
const config = resolveCaptureConfig(Bun.env);
// Quick Look also renders the shared spec sheet, so its shadow root carries that CSS too.
const SPEC_SHEET_CSS_PATHS = ["src/popup/spec-sheet.css", "src/popup/spec-sheet-wide.css"] as const;
const quickLookCss = await shadowStylesheet(["src/quicklook/quicklook.css", ...SPEC_SHEET_CSS_PATHS]);
const toastCss = await shadowStylesheet(["src/toast/toast.css"]);

// The service worker is an ES module (manifest "type": "module"); files given to
// chrome.scripting.executeScript must be classic scripts, hence IIFE.
const BUNDLES = [
  { entry: "src/background.ts", name: "background.js", format: "esm" },
  { entry: "src/page-capture-entry.ts", name: "page-capture.js", format: "iife" },
  { entry: "src/popup/popup-entry.ts", name: "popup.js", format: "iife" },
  { entry: "src/quicklook/quicklook-entry.ts", name: "quicklook.js", format: "iife" },
  { entry: "src/toast/toast-entry.ts", name: "toast.js", format: "iife" },
  { entry: "src/link-capture/link-alt-click-entry.ts", name: "link-alt-click.js", format: "iife" },
  { entry: "src/link-capture/offscreen-entry.ts", name: "offscreen.js", format: "iife" },
] as const;

// Shadow-DOM surfaces (Quick Look, toasts) ship their own stylesheet as a string baked into the bundle.
async function shadowStylesheet(ownCssPaths: readonly string[]): Promise<string> {
  const tokensPath = fileURLToPath(import.meta.resolve("@picky/ui-tokens/tokens.css"));
  const ownCss = await Promise.all(ownCssPaths.map((path) => Bun.file(join(import.meta.dir, path)).text()));
  return buildShadowStylesheet(await Bun.file(tokensPath).text(), ...ownCss);
}

async function buildBundle(bundle: (typeof BUNDLES)[number]): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, bundle.entry)],
    target: "browser",
    format: bundle.format,
    naming: bundle.name,
    outdir: OUT_DIR,
    define: {
      __PICKY_CAPTURE_CONFIG__: JSON.stringify(config),
      __PICKY_QUICKLOOK_CSS__: JSON.stringify(quickLookCss),
      __PICKY_TOAST_CSS__: JSON.stringify(toastCss),
    },
  });
  if (!result.success) throw new AggregateError(result.logs, `Bundling ${bundle.entry} failed`);
}

// popup.html links one stylesheet: the shared design tokens, the popup's own rules, then the spec view's.
async function writePopupStylesheet(): Promise<void> {
  const tokensPath = fileURLToPath(import.meta.resolve("@picky/ui-tokens/tokens.css"));
  const popupCss = await Bun.file(join(import.meta.dir, "src/popup/popup.css")).text();
  const specSheetCss = await Promise.all(
    SPEC_SHEET_CSS_PATHS.map((path) => Bun.file(join(import.meta.dir, path)).text()),
  );
  const tokensCss = await Bun.file(tokensPath).text();
  await Bun.write(join(OUT_DIR, "popup.css"), [tokensCss, popupCss, ...specSheetCss].join("\n"));
}

async function writeManifest(): Promise<void> {
  const manifest = await Bun.file(join(import.meta.dir, "public/manifest.json")).json();
  manifest.host_permissions = mergeHostPermissions(manifest.host_permissions, apiHostPermission(config));
  await Bun.write(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

await rm(OUT_DIR, { recursive: true, force: true });
await Promise.all(BUNDLES.map(buildBundle));
await cp(join(import.meta.dir, "public"), OUT_DIR, { recursive: true });
// Shared brand logo lives at the repo root so web, landing and extension use one file.
await cp(join(import.meta.dir, "../../assets/logo.png"), join(OUT_DIR, "logo.png"));
await writeManifest();
await writePopupStylesheet();
console.log(`Extension built to ${OUT_DIR} for API ${config.apiBaseUrl}, web ${config.webBaseUrl}`);
