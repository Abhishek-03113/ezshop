import { z } from "zod";
import { ScrapeError, type HtmlFetcher } from "./html-fetcher.ts";

// Self-hosted playwright-service picks a random user agent per request, and Amazon then sometimes
// serves its mobile site (no #productTitle). Pinning a desktop UA fixes it. See research/FINDINGS.md §6.
const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const SCRAPE_TIMEOUT_MS = 90_000;

const FirecrawlScrapeResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  data: z.object({ rawHtml: z.string().optional() }).optional(),
});

type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;

/**
 * HtmlFetcher backed by a Firecrawl `/v2/scrape` endpoint (no LLM needed for `rawHtml`).
 *
 * Pass an API key for hosted Firecrawl; self-hosted instances accept unauthenticated requests.
 *
 * @example await new FirecrawlHtmlFetcher("http://localhost:3002", fetch).fetchHtml("https://www.amazon.in/dp/B0FQG1YHYR")
 */
export class FirecrawlHtmlFetcher implements HtmlFetcher {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFunction: FetchFunction,
    private readonly apiKey: string | null = null,
  ) {}

  async fetchHtml(url: string): Promise<string> {
    const response = await this.fetchFunction(`${this.baseUrl}/v2/scrape`, {
      method: "POST",
      headers: buildScrapeHeaders(this.apiKey),
      body: JSON.stringify(buildScrapeRequest(url)),
    });
    return readRawHtml(url, response.status, await response.json());
  }
}

function buildScrapeHeaders(apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey !== null) headers.authorization = `Bearer ${apiKey}`;
  return headers;
}

function buildScrapeRequest(url: string): Record<string, unknown> {
  return {
    url,
    formats: ["rawHtml"],
    onlyMainContent: false,
    timeout: SCRAPE_TIMEOUT_MS,
    headers: { "User-Agent": DESKTOP_USER_AGENT },
  };
}

function readRawHtml(url: string, status: number, body: unknown): string {
  const parsed = FirecrawlScrapeResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ScrapeError(
      `Firecrawl returned HTTP ${status} with an unexpected body for ${url}; expected {success, data.rawHtml}`,
    );
  }
  const rawHtml = parsed.data.data?.rawHtml;
  if (parsed.data.success && rawHtml) return rawHtml;
  throw new ScrapeError(`Firecrawl could not scrape ${url} (HTTP ${status}): ${parsed.data.error ?? "empty rawHtml"}`);
}
