/** One product's value in a matrix row. `text` is null when the product has no such spec. */
export interface ComparisonCell {
  text: string | null;
  isBest: boolean;
}

export interface ComparisonRow {
  /** Normalized label key shared by every product's spec of this kind. */
  key: string;
  /** The label as the first product that has this spec spelled it. */
  label: string;
  /** One cell per product, in the order the snapshots were passed. */
  cells: ComparisonCell[];
  differs: boolean;
}

export interface ComparisonGroup {
  title: string;
  rows: ComparisonRow[];
  /** Rows of this group hidden because every product agrees (only with `differencesOnly`). */
  identicalCount: number;
}

export interface ComparisonMatrix {
  prices: ComparisonCell[];
  ratings: ComparisonCell[];
  groups: ComparisonGroup[];
  /** Sum of the groups' identicalCount. */
  identicalCount: number;
}

export interface ComparisonOptions {
  differencesOnly: boolean;
  /** Case-insensitive substring filter over row labels and values. */
  query?: string;
}
