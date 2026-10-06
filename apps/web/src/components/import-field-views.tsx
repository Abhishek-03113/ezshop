import { PRODUCT_SOURCES, sourceLabel } from "@picky/catalog";
import type { FormEvent } from "react";
import { LinkIcon } from "./icons.tsx";

export interface ImportFieldViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: (event: FormEvent) => void;
  isPending: boolean;
  errorMessage: string | null;
}

const SUPPORTED_STORES = new Intl.ListFormat("en", { type: "conjunction" }).format(PRODUCT_SOURCES.map(sourceLabel));

function ErrorLine({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <p className="form-error" role="alert">
      {message}
    </p>
  );
}

/** Compact pill that lives in the app bar of the library. */
export function ImportPillView({ url, onUrlChange, onSubmit, isPending, errorMessage }: ImportFieldViewProps) {
  return (
    <form className="import-pill" onSubmit={onSubmit}>
      <div className="import-pill-field">
        <LinkIcon size={16} />
        <label htmlFor="import-url" className="visually-hidden">
          Add a product by link
        </label>
        <input
          id="import-url"
          type="url"
          required
          placeholder="Paste a product link to add it"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
        />
        <button type="submit" className="pill-button" disabled={isPending}>
          {isPending ? "Reading…" : "Add"}
        </button>
      </div>
      <ErrorLine message={errorMessage} />
    </form>
  );
}

/** Large paste-a-link card for the empty library. */
export function ImportCardView({ url, onUrlChange, onSubmit, isPending, errorMessage }: ImportFieldViewProps) {
  return (
    <form className="card import-card" onSubmit={onSubmit}>
      <label htmlFor="import-url" className="import-card-label">
        Paste a product link
      </label>
      <div className="import-card-row">
        <input
          id="import-url"
          type="url"
          required
          placeholder="https://www.amazon.in/dp/…"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
        />
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "Reading page…" : "Get specs"}
        </button>
      </div>
      <span className="hint">{SUPPORTED_STORES} product pages</span>
      <ErrorLine message={errorMessage} />
    </form>
  );
}
