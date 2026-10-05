import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAutoImport } from "../hooks/use-auto-import.ts";
import { useImportProduct } from "../hooks/use-import-product.ts";
import { ImportCardView, ImportPillView } from "./import-field-views.tsx";

interface ImportProductFormProps {
  /** "pill" sits in the app bar; "card" is the big field of the welcome screen. */
  variant: "pill" | "card";
  /** From `?import=`: prefills the field and starts the import once. */
  autoImportUrl?: string | undefined;
}

/** Paste a product URL from any supported site; the API reads it and the spec sheet opens. */
export function ImportProductForm({ variant, autoImportUrl }: ImportProductFormProps) {
  const [url, setUrl] = useState(autoImportUrl ?? "");
  const importProduct = useImportProduct();
  const navigate = useNavigate();
  // On failure the param is dropped so a reload does not retry; the URL stays in the field with the error.
  const clearImportParam = () => void navigate({ to: "/", search: {}, replace: true });
  useAutoImport(autoImportUrl, (autoUrl) => importProduct.mutate(autoUrl, { onError: clearImportParam }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    importProduct.mutate(url.trim());
  };
  const viewProps = {
    url,
    onUrlChange: setUrl,
    onSubmit: submit,
    isPending: importProduct.isPending,
    errorMessage: importProduct.isError ? importProduct.error.message : null,
  };
  return variant === "pill" ? <ImportPillView {...viewProps} /> : <ImportCardView {...viewProps} />;
}
