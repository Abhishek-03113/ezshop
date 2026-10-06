/** Smooth unless the user asked for reduced motion; instant jumps are the accessible fallback. */
export function scrollBehaviorFor(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

/**
 * Scrolls the element with `anchor` as id into view and records it in the URL hash, so the jump is
 * shareable and the back button still works like a normal anchor link.
 *
 * @example scrollToAnchor("battery")
 */
export function scrollToAnchor(anchor: string): void {
  const target = document.getElementById(anchor);
  if (target === null) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: scrollBehaviorFor(reduced), block: "start" });
  history.replaceState(null, "", `#${anchor}`);
}
