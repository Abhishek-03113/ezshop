import type { ProductSnapshot } from "@ezshop/catalog";

/** A valid snapshot; override any field per test. */
export function buildSampleSnapshot(overrides: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    source: "amazon.in",
    externalId: "B0FQG1YHYR",
    url: "https://www.amazon.in/dp/B0FQG1YHYR",
    title: "Apple iPhone 17 512 GB",
    brand: "Apple",
    price: { amount: 124900, currency: "INR" },
    listPrice: null,
    availability: null,
    rating: { average: 4.7, count: 753 },
    images: ["https://m.media-amazon.com/images/I/61NBcHAmCpL._SL1500_.jpg"],
    highlights: [{ heading: "iOS", text: "Liquid Glass" }],
    specGroups: [{ title: "At a glance", specs: [{ label: "Brand", value: "Apple" }] }],
    capturedAt: "2026-10-05T10:00:00.000Z",
    ...overrides,
  };
}
