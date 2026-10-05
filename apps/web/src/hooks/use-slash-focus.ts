import { useEffect, type RefObject } from "react";

/**
 * Focuses the element when "/" is pressed outside any text field, the way GitHub and Gmail do.
 *
 * @example useSlashFocus(searchInputRef)
 */
export function useSlashFocus(target: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      target.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [target]);
}

/** The bits of an element isTypingTarget reads; structural so tests need no DOM. */
export interface TypingTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
}

const TEXT_ENTRY_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Whether a key press landed in something the user is typing into.
 *
 * @example isTypingTarget({ tagName: "INPUT" }) // true
 */
export function isTypingTarget(target: TypingTargetLike | EventTarget | null): boolean {
  if (target === null) return false;
  const { tagName = "", isContentEditable = false } = target as TypingTargetLike;
  return isContentEditable || TEXT_ENTRY_TAGS.has(tagName.toUpperCase());
}
