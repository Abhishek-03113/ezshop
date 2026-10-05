import { DirectoryFixtureFiles, PAGE_FIXTURES_DIR, PageFixtureStore, type PageFixture } from "@ezshop/catalog/testing";

/** Every captured product page from the catalog package, so API tests cover each supported site. */
export async function loadPageFixtures(): Promise<PageFixture[]> {
  const store = new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR));
  return Promise.all((await store.listNames()).map((name) => store.read(name)));
}

/** URL → HTML for a FakeHtmlFetcher serving all fixtures. */
export function htmlByFixtureUrl(fixtures: readonly PageFixture[]): ReadonlyMap<string, string> {
  return new Map(fixtures.map((fixture) => [fixture.url, fixture.html]));
}
