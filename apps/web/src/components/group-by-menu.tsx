import { GROUP_OPTIONS, groupLabel, type GroupKey, type GroupOption } from "../library/group-options.ts";
import { ChevronDownIcon, GridIcon } from "./icons.tsx";
import { MenuPopover } from "./menu-popover.tsx";

interface GroupByMenuProps {
  selected: GroupKey;
  onSelect: (key: GroupKey) => void;
}

/** "Group: Category ▾" button opening the five grouping choices; the pick lives in the URL. */
export function GroupByMenu({ selected, onSelect }: GroupByMenuProps) {
  const trigger = (
    <>
      <GridIcon size={16} />
      Group: <strong>{groupLabel(selected)}</strong>
      <ChevronDownIcon size={12} />
    </>
  );
  return (
    <MenuPopover label="Group by" triggerClassName="toolbar-button" trigger={trigger}>
      {(close) =>
        GROUP_OPTIONS.map((option) => (
          <GroupOptionItem
            key={option.key}
            option={option}
            checked={option.key === selected}
            onPick={() => {
              onSelect(option.key);
              close();
            }}
          />
        ))
      }
    </MenuPopover>
  );
}

interface GroupOptionItemProps {
  option: GroupOption;
  checked: boolean;
  onPick: () => void;
}

function GroupOptionItem({ option, checked, onPick }: GroupOptionItemProps) {
  return (
    <button type="button" role="menuitemradio" aria-checked={checked} className="menu-item" onClick={onPick}>
      <span className="menu-item-mark">{checked ? "✓" : ""}</span>
      <span>
        {option.label}
        <small>{option.hint}</small>
      </span>
    </button>
  );
}
