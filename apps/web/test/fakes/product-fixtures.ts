import type { CatalogProduct, CatalogProductSummary, ProductSnapshot } from "@ezshop/catalog";

export const inr = (amount: number) => ({ amount, currency: "INR" });

export function makeSnapshot(overrides: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    source: "amazon.in",
    externalId: "B09XS7JWHH",
    url: "https://www.amazon.in/dp/B09XS7JWHH",
    title: "Sony WH-1000XM5 Headphones",
    brand: "Sony",
    category: "Headphones",
    price: inr(28926),
    listPrice: inr(34990),
    availability: "In stock",
    rating: { average: 4.4, count: 17240 },
    images: ["https://img/1.jpg", "https://img/2.jpg"],
    highlights: [{ heading: null, text: "Industry leading noise cancellation" }],
    specGroups: [
      { title: "At a glance", specs: [{ label: "Brand", value: "Sony" }] },
      { title: "Battery", specs: [{ label: "Battery Average Life", value: "40 Hours" }] },
    ],
    capturedAt: "2026-10-05T06:14:00Z",
    ...overrides,
  };
}

export function makeProduct(id = "p1", overrides: Partial<ProductSnapshot> = {}): CatalogProduct {
  return {
    id,
    snapshot: makeSnapshot(overrides),
    createdAt: "2026-10-05T06:14:00Z",
    updatedAt: "2026-10-05T06:14:00Z",
  };
}

export function makeSummary(overrides: Partial<CatalogProductSummary> = {}): CatalogProductSummary {
  return {
    id: "p1",
    source: "amazon.in",
    title: "Sony WH-1000XM5 Headphones",
    brand: "Sony",
    category: "Headphones",
    price: inr(28926),
    imageUrl: "https://img/1.jpg",
    updatedAt: "2026-10-05T06:14:00Z",
    ...overrides,
  };
}
