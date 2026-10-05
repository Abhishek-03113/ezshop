import type { CatalogComparisonSummary } from "@ezshop/catalog";
import { MenuPopover } from "./menu-popover.tsx";

interface AddToComparisonMenuProps {
  comparisons: readonly CatalogComparisonSummary[];
  /** Name the "New comparison" entry will create, shown so the click is not a surprise. */
  newName: string;
  onAddTo: (comparison: CatalogComparisonSummary) => void;
  onCreateNew: () => void;
}

/** "Add to comparison…" menu: every existing comparison, then a "New comparison" entry. Opens upwards. */
export function AddToComparisonMenu({ comparisons, newName, onAddTo, onCreateNew }: AddToComparisonMenuProps) {
  return (
    <MenuPopover
      label="Add to comparison"
      triggerClassName="selection-add"
      trigger="Add to comparison…"
      placement="above"
    >
      {(close) => (
        <>
          {comparisons.map((comparison) => (
            <MenuEntry key={comparison.id} onPick={() => onAddTo(comparison)} close={close}>
              {comparison.name}
            </MenuEntry>
          ))}
          <MenuEntry accent onPick={onCreateNew} close={close}>
            New comparison “{newName}”
          </MenuEntry>
        </>
      )}
    </MenuPopover>
  );
}

interface MenuEntryProps {
  onPick: () => void;
  close: () => void;
  accent?: boolean;
  children: string | string[];
}

function MenuEntry({ onPick, close, accent = false, children }: MenuEntryProps) {
  const pick = () => {
    onPick();
    close();
  };
  return (
    <button type="button" role="menuitem" className={accent ? "menu-item accent" : "menu-item"} onClick={pick}>
      {children}
    </button>
  );
}
