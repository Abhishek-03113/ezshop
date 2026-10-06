/**
 * Tokens are written for `:root`; inside a shadow root they must attach to `:host`.
 *
 * @example tokensForShadowRoot(":root { --ez-blue: #007aff; }") // ":host { --ez-blue: #007aff; }"
 */
export function tokensForShadowRoot(tokensCss: string): string {
  return tokensCss.replaceAll(":root", ":host");
}

/**
 * The single stylesheet a shadow-DOM surface ships: shared tokens (re-targeted to :host) then its own
 * rules, in the order given (later rules win ties, so put shared component CSS after the surface's own).
 *
 * @example buildShadowStylesheet(tokens, quicklookCss, specSheetCss)
 */
export function buildShadowStylesheet(tokensCss: string, ...ownCss: readonly string[]): string {
  return [tokensForShadowRoot(tokensCss), ...ownCss].join("\n");
}
