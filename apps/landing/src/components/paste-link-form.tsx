import { useState, type FormEvent, type ReactElement } from "react";
import { submitProductLink, type Navigator } from "../lib/product-link.ts";
import { LinkIcon } from "./icons.tsx";

export interface PasteLinkFormProps {
  readonly webUrl: string;
  readonly navigator: Navigator;
}

const ERROR_ID = "paste-url-error";

/**
 * Paste-a-link fallback for people without the extension.
 * @example <PasteLinkForm webUrl="http://localhost:5173" navigator={browserNavigator} />
 */
export function PasteLinkForm({ webUrl, navigator }: PasteLinkFormProps): ReactElement {
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("product-url") ?? "");
    setError(submitProductLink(raw, webUrl, navigator));
  }

  return (
    <div className="paste">
      <form className="paste-form" onSubmit={onSubmit} noValidate>
        <LinkIcon />
        <label className="visually-hidden" htmlFor="paste-url">
          Product link
        </label>
        <input
          id="paste-url"
          name="product-url"
          type="url"
          autoComplete="off"
          placeholder="No extension? Paste an Amazon.in or Flipkart link"
          aria-invalid={error !== null}
          aria-describedby={error ? ERROR_ID : undefined}
        />
        <button className="pill pill-dark" type="submit">
          Get specs
        </button>
      </form>
      {error && (
        <p className="paste-error" id={ERROR_ID} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
