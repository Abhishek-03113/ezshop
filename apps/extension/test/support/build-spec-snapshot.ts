import type { ProductSnapshot } from "@ezshop/catalog";
import { buildSnapshot } from "./build-snapshot.ts";

/** A snapshot with price, discount, rating, highlights and three spec groups, for spec-view tests. */
export function buildSpecSnapshot(overrides: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    ...buildSnapshot(),
    price: { amount: 28926, currency: "INR" },
    listPrice: { amount: 34990, currency: "INR" },
    availability: "In stock",
    rating: { average: 4.4, count: 17240 },
    images: ["https://img.test/a.jpg"],
    highlights: [
      { heading: "Display", text: "6.3 inch OLED" },
      { heading: null, text: "Fast charging" },
      { heading: "Camera", text: "48 MP dual" },
      { heading: "Battery", text: "All day" },
    ],
    specGroups: [
      {
        title: "Display",
        specs: [
          { label: "Size", value: "6.3 inch" },
          { label: "Type", value: "OLED" },
        ],
      },
      { title: "Battery", specs: [{ label: "Capacity", value: "4000 mAh" }] },
      { title: "Item details", specs: [{ label: "Color", value: "Blue" }] },
    ],
    ...overrides,
  };
}
