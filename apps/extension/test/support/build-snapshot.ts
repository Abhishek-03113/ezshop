import type { CatalogProduct, ProductSnapshot } from "@picky/catalog";

export function buildSnapshot(): ProductSnapshot {
  return {
    source: "amazon.in",
    externalId: "B0FQG1YHYR",
    url: "https://www.amazon.in/dp/B0FQG1YHYR",
    title: "Apple iPhone 17",
    brand: "Apple",
    category: null,
    price: null,
    listPrice: null,
    availability: null,
    rating: null,
    images: [],
    highlights: [],
    specGroups: [],
    capturedAt: "2026-10-05T10:00:00.000Z",
  };
}

/** A stored product wrapping buildSnapshot(), for fakes that return CatalogProduct. */
export function buildCatalogProduct(id: string, overrides: Partial<ProductSnapshot> = {}): CatalogProduct {
  return {
    id,
    snapshot: { ...buildSnapshot(), externalId: id, ...overrides },
    createdAt: "2026-10-05T10:00:00.000Z",
    updatedAt: "2026-10-05T10:00:00.000Z",
  };
}
