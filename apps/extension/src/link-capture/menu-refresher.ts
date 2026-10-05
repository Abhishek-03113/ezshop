import type { ComparisonsClient } from "../comparisons/comparisons-client.ts";
import type { ContextMenuPort } from "./chrome-context-menu.ts";
import { buildMenuEntries } from "./context-menu-model.ts";

type Logger = (event: string, fields: Record<string, string | number>) => void;

/**
 * Rebuilds the "Add to ezshop" menu from the API. When the API is unreachable the menu still offers
 * "Library only" and "New comparison…" so right-click never goes dead.
 *
 * @example await new MenuRefresher(client, menu, () => settings.lastComparisonId(), log).refresh()
 */
export class MenuRefresher {
  constructor(
    private readonly comparisons: ComparisonsClient,
    private readonly menu: ContextMenuPort,
    private readonly lastUsedId: () => Promise<string | null>,
    private readonly log: Logger,
  ) {}

  async refresh(): Promise<void> {
    const comparisons = await this.comparisons.list().catch((error: unknown) => {
      this.log("menu.comparisons_unavailable", { reason: error instanceof Error ? error.message : String(error) });
      return [];
    });
    await this.menu.replaceAll(buildMenuEntries(comparisons, await this.lastUsedId()));
  }
}
