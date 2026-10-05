/**
 * Parses a URL and returns it only when its host is one of the given hosts.
 *
 * @example parseUrlOnHosts("https://www.flipkart.com/x", new Set(["www.flipkart.com"]))?.pathname // "/x"
 */
export function parseUrlOnHosts(pageUrl: string, hosts: ReadonlySet<string>): URL | null {
  const url = URL.parse(pageUrl);
  return url !== null && hosts.has(url.hostname) ? url : null;
}
