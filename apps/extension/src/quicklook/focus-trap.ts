/**
 * Keeps Tab inside the dialog: from the last control it wraps to the first, and Shift+Tab the other way.
 * Returns the element that should take focus, or null when the browser's default move stays inside.
 *
 * @example const next = nextFocusTarget(controls, shadowRoot.activeElement, event.shiftKey)
 */
export function nextFocusTarget(
  controls: readonly HTMLElement[],
  active: Element | null,
  backwards: boolean,
): HTMLElement | null {
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (first === undefined || last === undefined) return null;
  const index = controls.findIndex((control) => control === active);
  if (index === -1) return backwards ? last : first;
  if (backwards && index === 0) return last;
  if (!backwards && index === controls.length - 1) return first;
  return null;
}

const FOCUSABLE =
  'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focusable controls inside `container`, in DOM order. */
export function focusableControls(container: ParentNode): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}
