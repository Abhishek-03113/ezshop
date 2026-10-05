import { Window } from "happy-dom";

/** Builds a script-free DOM document, standing in for the live page the extension sees. */
export function domFromHtml(html: string): Document {
  const window = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true } });
  window.document.write(html);
  return window.document as unknown as Document;
}
