import { amazonExtractor } from "./amazon/amazon-extractor.ts";
import { flipkartExtractor } from "./flipkart/flipkart-extractor.ts";
import type { SiteExtractor } from "./site-extractor.ts";

/** Every marketplace Picky reads. Order does not matter: each owns a disjoint set of hosts. */
export const SITE_EXTRACTORS: readonly SiteExtractor[] = [amazonExtractor, flipkartExtractor];
