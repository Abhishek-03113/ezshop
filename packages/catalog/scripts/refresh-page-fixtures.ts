// Re-derives every fixture's expected snapshot from its stored HTML, after an intended extractor
// change. Review `git diff test/fixtures` before committing: this is what the golden tests compare to.
import { DirectoryFixtureFiles, PAGE_FIXTURES_DIR, PageFixtureStore } from "../src/testing/index.ts";

const store = new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR));
for (const name of await store.listNames()) {
  const fixture = await store.refresh(name);
  console.log(
    `${name}: ${fixture.expected.specGroups.length} spec groups, title "${fixture.expected.title.slice(0, 50)}"`,
  );
}
