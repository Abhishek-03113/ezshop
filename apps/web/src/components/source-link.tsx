import type { ProductSource } from "@ezshop/catalog";
import { sourceLabel } from "../format/source-label.ts";
import { ExternalLinkIcon } from "./icons.tsx";

/** "View on Amazon.in" pill that opens the original product page. */
export function SourceLink({ source, url }: { source: ProductSource; url: string }) {
  return (
    <a className="pill-link" href={url} target="_blank" rel="noreferrer">
      {`View on ${sourceLabel(source)}`}
      <ExternalLinkIcon size={14} />
    </a>
  );
}
