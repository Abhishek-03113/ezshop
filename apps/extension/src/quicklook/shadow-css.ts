/**
 * Tokens are written for `:root`; inside a shadow root they must attach to `:host`.
 *
 * @example tokensForShadowRoot(":root { --ez-blue: #007aff; }") // ":host { --ez-blue: #007aff; }"
 */
export function tokensForShadowRoot(tokensCss: string): string {
  return tokensCss.replaceAll(":root", ":host");
}

/**
 * The single stylesheet a shadow-DOM surface ships: shared tokens (re-targeted to :host) then its own rules.
 *
 * @example buildShadowStylesheet(tokens, quicklookCss)
 */
export function buildShadowStylesheet(tokensCss: string, ownCss: string): string {
  return `${tokensForShadowRoot(tokensCss)}\n${ownCss}`;
}
