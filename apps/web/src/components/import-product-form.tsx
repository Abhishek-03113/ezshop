import { PRODUCT_SOURCES } from "@ezshop/catalog";
import { useState, type FormEvent } from "react";
import { formatSourceList } from "../format/format-sources.ts";
import { useImportProduct } from "../hooks/use-import-product.ts";

const IMPORT_PLACEHOLDER = `Paste a product URL from ${formatSourceList(PRODUCT_SOURCES)}`;

/** Paste a product URL from any supported site; the API scrapes it through Firecrawl and opens the spec sheet. */
export function ImportProductForm() {
  const [url, setUrl] = useState("");
  const importProduct = useImportProduct();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    importProduct.mutate(url.trim());
  };
  return (
    <form className="import-form" onSubmit={submit}>
      <label htmlFor="import-url">Import by URL</label>
      <div className="import-row">
        <input
          id="import-url"
          type="url"
          required
          placeholder={IMPORT_PLACEHOLDER}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <button type="submit" disabled={importProduct.isPending}>
          {importProduct.isPending ? "Reading page…" : "Import"}
        </button>
      </div>
      {importProduct.isError && (
        <p className="form-error" role="alert">
          {importProduct.error.message}
        </p>
      )}
    </form>
  );
}
