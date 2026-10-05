import { PRODUCT_SOURCES } from "@ezshop/catalog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { productListQuery } from "../api/product-queries.ts";
import { ImportProductForm } from "../components/import-product-form.tsx";
import { ProductCard } from "../components/product-card.tsx";
import { formatSourceList } from "../format/format-sources.ts";

const rootRouteApi = getRouteApi("__root__");

/** Home: import form plus every captured product, newest first. */
export function ProductListPage() {
  const { productsClient } = rootRouteApi.useRouteContext();
  const { data: products } = useSuspenseQuery(productListQuery(productsClient));
  return (
    <div className="list-page">
      <ImportProductForm />
      <h2 className="section-title">
        Products <span className="count">{products.length}</span>
      </h2>
      {products.length === 0 ? (
        <p className="panel muted">
          Nothing captured yet. Open a product page on {formatSourceList(PRODUCT_SOURCES)} and click the ezshop
          extension (Alt+Shift+E), or import a URL above.
        </p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
