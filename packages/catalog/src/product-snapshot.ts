import { z } from "zod";

/** Marketplaces Picky can read; each has a SiteExtractor in src/extract/site-extractors.ts. */
export const PRODUCT_SOURCES = ["amazon.in", "flipkart.com"] as const;

export const MoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
});

export const SpecSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const SpecGroupSchema = z.object({
  title: z.string().min(1),
  specs: z.array(SpecSchema).min(1),
});

export const HighlightSchema = z.object({
  heading: z.string().min(1).nullable(),
  text: z.string().min(1),
});

export const RatingSchema = z.object({
  average: z.number().min(0).max(5),
  count: z.number().int().nonnegative(),
});

/**
 * Everything Picky keeps about one product page at one moment.
 * Produced by the extension (live DOM) or the API (Firecrawl HTML); both use the same extractor.
 *
 * @example ProductSnapshotSchema.parse(await request.json())
 */
export const ProductSnapshotSchema = z.object({
  source: z.enum(PRODUCT_SOURCES),
  externalId: z.string().min(1),
  url: z.url(),
  title: z.string().min(1),
  brand: z.string().min(1).nullable(),
  // Rows stored before categories existed lack the key; default keeps them readable.
  category: z.string().min(1).nullable().default(null),
  price: MoneySchema.nullable(),
  listPrice: MoneySchema.nullable(),
  availability: z.string().min(1).nullable(),
  rating: RatingSchema.nullable(),
  images: z.array(z.url()),
  highlights: z.array(HighlightSchema),
  specGroups: z.array(SpecGroupSchema),
  capturedAt: z.iso.datetime(),
});

export type ProductSource = (typeof PRODUCT_SOURCES)[number];
export type Money = z.infer<typeof MoneySchema>;
export type Spec = z.infer<typeof SpecSchema>;
export type SpecGroup = z.infer<typeof SpecGroupSchema>;
export type Highlight = z.infer<typeof HighlightSchema>;
export type Rating = z.infer<typeof RatingSchema>;
export type ProductSnapshot = z.infer<typeof ProductSnapshotSchema>;

/** A stored snapshot, as the API returns it. */
export interface CatalogProduct {
  id: string;
  snapshot: ProductSnapshot;
  createdAt: string;
  updatedAt: string;
}

/** The slim row the product list shows. */
export interface CatalogProductSummary {
  id: string;
  source: ProductSource;
  title: string;
  brand: string | null;
  category: string | null;
  price: Money | null;
  imageUrl: string | null;
  updatedAt: string;
}
