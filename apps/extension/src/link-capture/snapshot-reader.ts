import type { ProductSnapshot } from "@picky/catalog";

/** Turns downloaded product-page HTML into a snapshot; chrome-snapshot-reader.ts does it in an offscreen document. */
export interface SnapshotReader {
  read(html: string, url: string): Promise<ProductSnapshot>;
}
