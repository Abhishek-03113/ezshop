import { PRODUCT_SOURCES, sourceLabel } from "@picky/catalog";
import type { FormEvent } from "react";
import { LinkIcon } from "./icons.tsx";

export interface ImportFieldViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: (event: FormEvent) => void;
  isPending: boolean;
  /** The extension is not installed: the field is greyed out and points to it. */
  isUnavailable: boolean;
  errorMessage: string | null;
}

const UNAVAILABLE_NOTE = "Adding by link needs the Picky extension. Install it, then reload this page.";

const SUPPORTED_STORES = new Intl.ListFormat("en", { type: "conjunction" }).format(PRODUCT_SOURCES.map(sourceLabel));

function ErrorLine({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <p className="form-error" role="alert">
      {message}
    </p>
  );
}

function formClassName(base: string, isUnavailable: boolean): string {
  return isUnavailable ? `${base} is-unavailable` : base;
}

/** Compact pill that lives in the app bar of the library. */
export function ImportPillView(props: ImportFieldViewProps) {
  const { url, onUrlChange, onSubmit, isPending, isUnavailable, errorMessage } = props;
  return (
    <form
      className={formClassName("import-pill", isUnavailable)}
      onSubmit={onSubmit}
      title={isUnavailable ? UNAVAILABLE_NOTE : undefined}
    >
      <div className="import-pill-field">
        <LinkIcon size={16} />
        <label htmlFor="import-url" className="visually-hidden">
          Add a product by link
        </label>
        <input
          id="import-url"
          type="url"
          required
          placeholder={isUnavailable ? "Add products with the extension" : "Paste a product link to add it"}
          value={url}
          disabled={isUnavailable}
          onChange={(event) => onUrlChange(event.target.value)}
        />
        <button type="submit" className="pill-button" disabled={isPending || isUnavailable}>
          {isPending ? "Reading…" : "Add"}
        </button>
      </div>
      <ErrorLine message={errorMessage} />
    </form>
  );
}

/** Large paste-a-link card for the empty library. */
export function ImportCardView(props: ImportFieldViewProps) {
  const { url, onUrlChange, onSubmit, isPending, isUnavailable, errorMessage } = props;
  return (
    <form className={formClassName("card import-card", isUnavailable)} onSubmit={onSubmit}>
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
          disabled={isUnavailable}
          onChange={(event) => onUrlChange(event.target.value)}
        />
        <button type="submit" className="primary-button" disabled={isPending || isUnavailable}>
          {isPending ? "Reading page…" : "Get specs"}
        </button>
      </div>
      <span className="hint">{isUnavailable ? UNAVAILABLE_NOTE : `${SUPPORTED_STORES} product pages`}</span>
      <ErrorLine message={errorMessage} />
    </form>
  );
}
