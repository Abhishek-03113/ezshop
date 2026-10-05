import type { Navigator } from "../../src/lib/product-link.ts";

/** Records navigations instead of leaving the page. */
export class FakeNavigator implements Navigator {
  readonly visited: string[] = [];

  navigate(url: string): void {
    this.visited.push(url);
  }
}
