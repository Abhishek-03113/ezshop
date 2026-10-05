import { SUPPORTED_SITES } from "./sites.ts";

export type ProductLinkCheck =
  { readonly ok: true; readonly url: string } | { readonly ok: false; readonly message: string };

/** Hosts we accept, derived from the display constant so there is one list to maintain. */
const ALLOWED_HOSTS: readonly string[] = SUPPORTED_SITES.map((site) => site.host);

function parseHttpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * Checks that the text is an http(s) link on a supported store.
 * @example validateProductLink("https://www.amazon.in/dp/B09XS7JWHH") // { ok: true, url: "..." }
 */
export function validateProductLink(raw: string): ProductLinkCheck {
  const text = raw.trim();
  const parsed = parseHttpUrl(text);
  if (!parsed) {
    return {
      ok: false,
      message: `"${text}" is not a web link. Expected an http(s) URL such as https://www.amazon.in/dp/...`,
    };
  }
  if (!isAllowedHost(parsed.hostname)) {
    return {
      ok: false,
      message: `"${text}" is on ${parsed.hostname}. Expected a link on ${ALLOWED_HOSTS.join(" or ")}.`,
    };
  }
  return { ok: true, url: parsed.toString() };
}

/**
 * The web app prefills and auto-imports whatever `?import=` carries.
 * @example buildImportUrl("http://localhost:5173", "https://amazon.in/dp/X") // "http://localhost:5173/?import=https%3A%2F%2Famazon.in%2Fdp%2FX"
 */
export function buildImportUrl(webUrl: string, productUrl: string): string {
  return `${webUrl}/?import=${encodeURIComponent(productUrl)}`;
}

/** Side effect owned by the composition root; tests pass a fake. */
export interface Navigator {
  navigate(url: string): void;
}

/**
 * Validates, then navigates to the web app. Returns the error message to show, or null on success.
 * @example submitProductLink("nope", "http://x", nav) // an error message and nav is untouched
 */
export function submitProductLink(raw: string, webUrl: string, navigator: Navigator): string | null {
  const check = validateProductLink(raw);
  if (!check.ok) return check.message;
  navigator.navigate(buildImportUrl(webUrl, check.url));
  return null;
}
