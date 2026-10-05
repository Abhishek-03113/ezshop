import { useCallback, useRef, useState, type ReactNode } from "react";
import { useDismiss } from "../hooks/use-dismiss.ts";

interface MenuPopoverProps {
  /** Accessible name of both the trigger and the menu. */
  label: string;
  triggerClassName: string;
  trigger: ReactNode;
  /** Where the menu opens: the selection bar sits at the bottom, so its menu opens upwards. */
  placement?: "below" | "above";
  children: (close: () => void) => ReactNode;
}

/** A button that opens a floating menu; closes on Escape, outside press, or when an item calls `close`. */
export function MenuPopover({ label, triggerClassName, trigger, placement = "below", children }: MenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);
  return (
    <div className="menu-anchor" ref={containerRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      {open && (
        <div role="menu" aria-label={label} className={`menu-popover ${placement}`}>
          {children(close)}
        </div>
      )}
    </div>
  );
}
