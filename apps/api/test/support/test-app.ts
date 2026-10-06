import { AuthService } from "../../src/auth/auth-service.ts";
import type { DecisionModel } from "../../src/decisions/decision-model.ts";
import { createApp } from "../../src/http/create-app.ts";
import { ProductIngestion } from "../../src/products/product-ingestion.ts";
import { FakeHtmlFetcher } from "../fakes/fake-html-fetcher.ts";
import { InMemoryAccountRepository } from "../fakes/in-memory-account-repository.ts";
import { InMemoryComparisonRepository } from "../fakes/in-memory-comparison-repository.ts";
import { InMemoryProductRepository } from "../fakes/in-memory-product-repository.ts";
import { plainPasswordHasher } from "../fakes/plain-password-hasher.ts";
import { RecordingLogger } from "../fakes/recording-logger.ts";

export const TEST_NOW = new Date("2026-10-05T10:00:00Z");

export interface TestAppOptions {
  /** Pages the fake scraper serves to /api/imports. */
  htmlByUrl?: ReadonlyMap<string, string>;
  decisionModel?: DecisionModel;
}

/**
 * The real app over in-memory fakes, plus helpers to sign users up and send requests as them.
 *
 * @example const harness = createTestApp(); const alice = await harness.signUp("alice@example.com")
 */
export function createTestApp({ htmlByUrl = new Map(), decisionModel }: TestAppOptions = {}) {
  const accounts = new InMemoryAccountRepository();
  const repository = new InMemoryProductRepository();
  const logger = new RecordingLogger();
  const app = createApp({
    auth: new AuthService(accounts, plainPasswordHasher, () => TEST_NOW),
    repository,
    comparisons: new InMemoryComparisonRepository(repository),
    ingestion: new ProductIngestion(repository, new FakeHtmlFetcher(htmlByUrl), () => TEST_NOW),
    logger,
    sessionCookie: { secure: true },
    webOrigin: "http://web.test",
    decisionModel,
  });

  /** Sends a request, as a user when `cookie` is given; a JSON body sets the content type. */
  async function send(method: string, path: string, options: { body?: unknown; cookie?: string } = {}) {
    const headers: Record<string, string> = {};
    if (options.cookie !== undefined) headers.cookie = options.cookie;
    if (options.body !== undefined) headers["content-type"] = "application/json";
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    return app.request(`http://api.test${path}`, { method, headers, body });
  }

  /** Signs up and returns the `cookie` header value that authenticates later requests. */
  async function signUp(email: string, password = "correct horse"): Promise<string> {
    const response = await send("POST", "/api/auth/signup", { body: { email, password } });
    if (response.status !== 201) throw new Error(`Sign-up of ${email} answered ${response.status}; expected 201`);
    return sessionCookieOf(response);
  }

  return { app, accounts, repository, logger, send, signUp };
}

/**
 * The `name=value` part of the response's Set-Cookie, ready to send back as a Cookie header.
 *
 * @example sessionCookieOf(response) // "picky_session=abc..."
 */
export function sessionCookieOf(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const pair = setCookie.split(";")[0] ?? "";
  if (!pair.startsWith("picky_session=")) throw new Error(`Response set cookie "${setCookie}"; expected picky_session`);
  return pair;
}
