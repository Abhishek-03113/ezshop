import { z } from "zod";
import type { PageNode } from "../../page/page-node.ts";
import type { Money, Rating } from "../../product-snapshot.ts";
import { schemaOrgAvailabilityLabel } from "./schema-org-availability.ts";

const OneOrMany = <T extends z.ZodType>(item: T) => z.union([item, z.array(item)]);

// Lenient on purpose: sites fill schema.org loosely (numbers as strings, brand as text or object).
const JsonLdOfferSchema = z.object({
  price: z.coerce.number().optional(),
  priceCurrency: z.string().length(3).optional(),
  availability: z.string().optional(),
});
const JsonLdProductSchema = z.object({
  "@type": OneOrMany(z.string()),
  name: z.string().optional(),
  sku: z.string().optional(),
  image: OneOrMany(z.string()).optional(),
  brand: z.union([z.string(), z.object({ name: z.string() })]).optional(),
  aggregateRating: z.object({ ratingValue: z.coerce.number(), ratingCount: z.coerce.number().optional() }).optional(),
  offers: OneOrMany(JsonLdOfferSchema).optional(),
});
type RawJsonLdProduct = z.infer<typeof JsonLdProductSchema>;

/** The schema.org Product fields ezshop uses, normalised. */
export interface JsonLdProduct {
  name: string | null;
  sku: string | null;
  brand: string | null;
  images: string[];
  price: Money | null;
  availability: string | null;
  rating: Rating | null;
}

/**
 * Finds the schema.org Product in the page's JSON-LD blocks (top-level, array or @graph).
 *
 * @example readJsonLdProduct(page)?.price // { amount: 84999, currency: "INR" }
 */
export function readJsonLdProduct(page: PageNode): JsonLdProduct | null {
  const product = page
    .findAll('script[type="application/ld+json"]')
    .flatMap((script) => parseJsonLdNodes(script.text()))
    .map((node) => JsonLdProductSchema.safeParse(node))
    .find((parsed) => parsed.success && [parsed.data["@type"]].flat().includes("Product"));
  return product?.success ? normalizeJsonLdProduct(product.data) : null;
}

/**
 * Parses one JSON-LD block into its nodes; malformed JSON yields none.
 *
 * @example parseJsonLdNodes('{"@graph":[{"@type":"Product"}]}') // [{ "@type": "Product" }]
 */
export function parseJsonLdNodes(json: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return [parsed].flat().flatMap(expandGraph);
  } catch {
    return [];
  }
}

function expandGraph(node: unknown): unknown[] {
  const graph = typeof node === "object" && node !== null && "@graph" in node ? node["@graph"] : undefined;
  return Array.isArray(graph) ? graph : [node];
}

function normalizeJsonLdProduct(raw: RawJsonLdProduct): JsonLdProduct {
  const offer = [raw.offers ?? []].flat()[0];
  return {
    name: raw.name ?? null,
    sku: raw.sku ?? null,
    brand: typeof raw.brand === "string" ? raw.brand : (raw.brand?.name ?? null),
    images: [raw.image ?? []].flat(),
    price: offerPrice(offer),
    availability: offer?.availability ? schemaOrgAvailabilityLabel(offer.availability) : null,
    rating: aggregateRating(raw.aggregateRating),
  };
}

function offerPrice(offer: z.infer<typeof JsonLdOfferSchema> | undefined): Money | null {
  if (offer?.price === undefined || offer.priceCurrency === undefined) return null;
  return { amount: offer.price, currency: offer.priceCurrency };
}

function aggregateRating(raw: RawJsonLdProduct["aggregateRating"]): Rating | null {
  if (raw === undefined) return null;
  return { average: raw.ratingValue, count: raw.ratingCount ?? 0 };
}
