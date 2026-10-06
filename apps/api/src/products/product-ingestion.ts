import { ProductSnapshotSchema, type CatalogProduct } from "@picky/catalog";
import type { ProductRepository } from "./product-repository.ts";

/** A submitted snapshot does not match ProductSnapshotSchema. `issues` lists each failing path. */
export class InvalidSnapshotError extends Error {
  override readonly name = "InvalidSnapshotError";
  constructor(
    message: string,
    readonly issues: readonly string[],
  ) {
    super(message);
  }
}

/**
 * How products enter picky: the extension parses the page in the user's browser and posts the snapshot,
 * which is validated here before it is stored.
 *
 * @example await new ProductIngestion(repository).ingestSnapshot(body)
 */
export class ProductIngestion {
  constructor(private readonly repository: ProductRepository) {}

  async ingestSnapshot(candidate: unknown): Promise<CatalogProduct> {
    const parsed = ProductSnapshotSchema.safeParse(candidate);
    if (parsed.success) return this.repository.saveSnapshot(parsed.data);
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
    throw new InvalidSnapshotError(`Snapshot rejected: ${issues.join("; ")}`, issues);
  }
}
