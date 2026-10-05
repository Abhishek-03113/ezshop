/** Where "Add to ezshop" puts a product. */
export type AddTarget =
  /** The last-used comparison, falling back to the first, then to a new one. Used by Alt+click. */
  { kind: "last" } | { kind: "comparison"; comparisonId: string } | { kind: "library" } | { kind: "new" };
