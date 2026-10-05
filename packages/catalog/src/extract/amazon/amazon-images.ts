import { firstAttr, type PageNode } from "../../page/page-node.ts";

// Amazon image URLs carry a resize directive before the extension: …/I/31tFpNCkk5L._SX38_SY50_CR,0,0,38,50_.jpg
const RESIZE_DIRECTIVE = /\._[^/]*_\.(jpg|jpeg|png|webp)$/i;
const LARGE_IMAGE_DIRECTIVE = "._SL1000_.";

// The MAIN thumbnail duplicates the landing image; video thumbnails are play-icon overlays, not photos.
const GALLERY_THUMBNAILS = "#altImages li.imageThumbnail:not(.variant-MAIN) img";

/**
 * Collects the landing image plus the gallery, upgraded from thumbnails to large renditions.
 *
 * @example extractAmazonImages(page)[0] // "https://m.media-amazon.com/images/I/61NBcHAmCpL._SL1500_.jpg"
 */
export function extractAmazonImages(page: PageNode): string[] {
  const landing = firstAttr(page, "#landingImage", "data-old-hires") ?? firstAttr(page, "#landingImage", "src");
  const gallery = page
    .findAll(GALLERY_THUMBNAILS)
    .map((thumbnail) => thumbnail.attr("src"))
    .filter((src): src is string => src !== null && src.startsWith("https://"))
    .map(enlargeAmazonImageUrl);
  const all = landing === null || landing === "" ? gallery : [landing, ...gallery];
  return [...new Set(all)];
}

/**
 * Swaps an Amazon image URL's resize directive for a large one.
 *
 * @example enlargeAmazonImageUrl("…/I/abc._SX38_SY50_.jpg") // "…/I/abc._SL1000_.jpg"
 */
export function enlargeAmazonImageUrl(src: string): string {
  return src.replace(RESIZE_DIRECTIVE, `${LARGE_IMAGE_DIRECTIVE}$1`);
}
