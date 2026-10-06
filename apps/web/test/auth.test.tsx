import { describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { createAuthClient } from "../src/api/auth-client.ts";
import { authQueryKeys } from "../src/api/auth-queries.ts";
import { ApiRequestError } from "../src/api/json-requester.ts";
import { requireSignedIn, skipSignInWhenSignedIn } from "../src/auth/route-guards.ts";
import { createSessionExpiryHandler, type SignInNavigator } from "../src/auth/session-expiry.ts";
import { afterSignInPath, parseSignInSearch } from "../src/auth/sign-in-search.ts";
import { FakeApiServer } from "./fakes/fake-api-server.ts";
import { FakeAuthClient, SIGNED_IN_USER } from "./fakes/fake-auth-client.ts";
import { FakeComparisonsClient } from "./fakes/fake-comparisons-client.ts";
import { FakeProductsClient } from "./fakes/fake-products-client.ts";
import { renderAppWithRouter } from "./fakes/render-app.tsx";

const signedOut = () => new FakeAuthClient(null);

describe("route guards", () => {
  const guardContext = (authClient: FakeAuthClient) => ({ queryClient: new QueryClient(), authClient });

  async function thrownRedirect(guard: Promise<void>): Promise<unknown> {
    const thrown = await guard.then(
      () => null,
      (error: unknown) => error,
    );
    if (!isRedirect(thrown)) throw new Error(`Guard threw ${String(thrown)}; expected a redirect`);
    return thrown.options;
  }

  test("a signed-out visitor is sent to /login, remembering where they were going", async () => {
    const guard = requireSignedIn(guardContext(signedOut()), { pathname: "/comparisons", href: "/comparisons?x=1" });
    expect(await thrownRedirect(guard)).toMatchObject({ to: "/login", search: { redirect: "/comparisons?x=1" } });
  });

  test("lets a signed-in user through, and /login through for anyone", async () => {
    await requireSignedIn(guardContext(new FakeAuthClient()), { pathname: "/", href: "/" });
    await requireSignedIn(guardContext(signedOut()), { pathname: "/login", href: "/login" });
  });

  test("a signed-in user visiting /login goes straight to the redirect target", async () => {
    const guard = skipSignInWhenSignedIn(guardContext(new FakeAuthClient()), { redirect: "/comparisons" });
    expect(await thrownRedirect(guard)).toMatchObject({ href: "/comparisons" });
    await skipSignInWhenSignedIn(guardContext(signedOut()), {});
  });

  test("signed out, the app requests no library or comparison", async () => {
    const products = new FakeProductsClient();
    await renderAppWithRouter("/", products, new FakeComparisonsClient(), signedOut());
    expect(products.listedQueries).toEqual([]);
  });

  test("a new account's empty library still offers Sign out", async () => {
    const { html } = await renderAppWithRouter("/", new FakeProductsClient());
    expect(html).toContain("Welcome to Picky");
    expect(html).toContain("Sign out");
  });

  test("signed in, the nav offers Sign out with the account's email", async () => {
    const { html } = await renderAppWithRouter("/comparisons", new FakeProductsClient());
    expect(html).toContain("Sign out");
    expect(html).toContain(`Signed in as ${SIGNED_IN_USER.email}`);
  });
});

describe("sign-in page", () => {
  test("?mode=signup shows the create-account form, which says specs need no account", async () => {
    const { html } = await renderAppWithRouter(
      "/login?mode=signup",
      new FakeProductsClient(),
      new FakeComparisonsClient(),
      signedOut(),
    );
    expect(html).toContain("Create your Picky account");
    expect(html).toContain("never needs an account");
    expect(html).toContain('autoComplete="new-password"');
  });
});

describe("parseSignInSearch", () => {
  test("keeps site paths and drops anything that could leave the site", () => {
    expect(parseSignInSearch({ redirect: "/products/p1?tab=specs" })).toEqual({ redirect: "/products/p1?tab=specs" });
    for (const redirect of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", 7]) {
      expect(parseSignInSearch({ redirect })).toEqual({});
    }
  });

  test("only signup is a mode; afterSignInPath falls back to the library", () => {
    expect(parseSignInSearch({ mode: "signup" })).toEqual({ mode: "signup" });
    expect(parseSignInSearch({ mode: "admin" })).toEqual({});
    expect(afterSignInPath({})).toBe("/");
  });
});

describe("createAuthClient", () => {
  test("currentUser is null on 401 and posts credentials to sign in", async () => {
    expect(await createAuthClient(new FakeApiServer(401, { message: "Sign in" }).fetch, "").currentUser()).toBeNull();
    const server = new FakeApiServer(200, { user: SIGNED_IN_USER });
    expect(await createAuthClient(server.fetch, "").signIn("me@example.com", "pw")).toEqual(SIGNED_IN_USER);
    expect(server.calls).toEqual([
      { url: "/api/auth/signin", method: "POST", body: '{"email":"me@example.com","password":"pw"}' },
    ]);
  });

  test("currentUser still throws on a server error", async () => {
    const client = createAuthClient(new FakeApiServer(500, { message: "boom" }).fetch, "");
    await expect(client.currentUser()).rejects.toThrow("boom");
  });
});

describe("createSessionExpiryHandler", () => {
  function setup(pathname: string) {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.currentUser, SIGNED_IN_USER);
    const navigations: unknown[] = [];
    const router: SignInNavigator = {
      state: { location: { pathname, href: `${pathname}?q=1` } },
      navigate: async (options) => void navigations.push(options),
    };
    return { queryClient, navigations, handle: createSessionExpiryHandler(queryClient, router) };
  }

  test("a 401 forgets the user and sends them to sign in, then back", () => {
    const { queryClient, navigations, handle } = setup("/comparisons");
    handle(new ApiRequestError("Sign in", 401));
    expect(queryClient.getQueryData(authQueryKeys.currentUser)).toBeNull();
    expect(navigations).toEqual([{ to: "/login", search: { redirect: "/comparisons?q=1" } }]);
  });

  test("ignores other errors, and a 401 on /login (a wrong password)", () => {
    const elsewhere = setup("/comparisons");
    elsewhere.handle(new ApiRequestError("Gone", 404));
    elsewhere.handle(new Error("network"));
    const onLogin = setup("/login");
    onLogin.handle(new ApiRequestError("Email or password is incorrect", 401));
    expect([...elsewhere.navigations, ...onLogin.navigations]).toEqual([]);
  });
});
