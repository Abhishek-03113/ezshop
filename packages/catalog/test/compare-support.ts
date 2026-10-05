import type { ProductSnapshot } from "../src/product-snapshot.ts";

type SpecSeed = readonly [group: string, label: string, value: string];

/** Builds a minimal snapshot whose spec groups come from (group, label, value) triples. */
export function snapshotWith(
  title: string,
  specs: readonly SpecSeed[],
  overrides: Partial<ProductSnapshot> = {},
): ProductSnapshot {
  const titles = [...new Set(specs.map(([group]) => group))];
  return {
    source: "amazon.in",
    externalId: title.replace(/\W/g, "").slice(0, 10) || "X",
    url: "https://www.amazon.in/dp/B0FQG1YHYR",
    title,
    brand: null,
    category: null,
    price: null,
    listPrice: null,
    availability: null,
    rating: null,
    images: [],
    highlights: [],
    specGroups: titles.map((group) => ({
      title: group,
      specs: specs.filter(([g]) => g === group).map(([, label, value]) => ({ label, value })),
    })),
    capturedAt: "2026-10-05T10:00:00.000Z",
    ...overrides,
  } as ProductSnapshot;
}
