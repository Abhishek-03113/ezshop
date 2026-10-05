/** The page is not a product page ezshop can read: unsupported site, challenge page, or missing fields. */
export class ProductPageError extends Error {
  override readonly name = "ProductPageError";
}
