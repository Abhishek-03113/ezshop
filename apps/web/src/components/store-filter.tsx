import { storeFilterOptions, type StoreFilter } from "../format/source-label.ts";

interface StoreFilterControlProps {
  selected: StoreFilter;
  onSelect: (store: StoreFilter) => void;
}

/** Segmented All / Amazon.in / Flipkart control; each segment is a toggle button. */
export function StoreFilterControl({ selected, onSelect }: StoreFilterControlProps) {
  return (
    <div role="group" aria-label="Filter by store" className="segmented">
      {storeFilterOptions().map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === selected}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
