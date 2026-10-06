import { type SpecGroup, specGroupAnchor } from "@picky/catalog";
import type { MouseEvent } from "react";

interface SpecGroupNavProps {
  groups: readonly SpecGroup[];
  /** Anchor of the group currently highlighted; its chip is marked too, so chip and card read as a pair. */
  activeAnchor?: string | null;
  /** Called with the group's anchor; the sheet scrolls to and highlights it. */
  onSelect?: (anchor: string) => void;
}

/** Chips that jump to each visible group, with its spec count. Without `onSelect` they are plain anchors. */
export function SpecGroupNav({ groups, activeAnchor = null, onSelect }: SpecGroupNavProps) {
  if (groups.length === 0) return null;
  return (
    <nav aria-label="Spec groups" className="group-chips">
      {groups.map((group) => {
        const anchor = specGroupAnchor(group.title);
        const select = (event: MouseEvent) => {
          if (onSelect === undefined) return;
          event.preventDefault();
          onSelect(anchor);
        };
        return (
          <a
            key={group.title}
            href={`#${anchor}`}
            aria-current={anchor === activeAnchor ? "true" : undefined}
            onClick={select}
          >
            {group.title} <span className="count">{group.specs.length}</span>
          </a>
        );
      })}
    </nav>
  );
}
