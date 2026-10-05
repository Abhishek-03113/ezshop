import type { ActiveTab } from "../../src/capture-flow.ts";
import type { ActiveTabSource } from "../../src/popup/active-tab-source.ts";

/** ActiveTabSource that always reports the same tab (or none). */
export class FakeActiveTabSource implements ActiveTabSource {
  constructor(private readonly tab: ActiveTab | null) {}

  async getActiveTab(): Promise<ActiveTab | null> {
    return this.tab;
  }
}
