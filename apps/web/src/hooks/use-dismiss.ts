import { useEffect, type RefObject } from "react";

/**
 * Calls `onDismiss` on Escape or a press outside `containerRef`, while `active`. Menus and popovers
 * share it so none of them traps the user.
 *
 * @example useDismiss(menuRef, isOpen, () => setOpen(false))
 */
export function useDismiss(containerRef: RefObject<HTMLElement | null>, active: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onDismiss();
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [containerRef, active, onDismiss]);
}
