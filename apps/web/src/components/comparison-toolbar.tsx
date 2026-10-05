import type { MatrixControls, RowMode } from "../hooks/use-matrix-controls.ts";
import { SearchIcon } from "./icons.tsx";

const MODES: readonly { value: RowMode; label: string }[] = [
  { value: "differences", label: "Differences" },
  { value: "all", label: "All specs" },
];

/** Differences | All specs, the spec filter and the "Mark best values" switch. */
export function ComparisonToolbar({ controls }: { controls: MatrixControls }) {
  return (
    <div className="compare-toolbar">
      <ModeSwitch mode={controls.mode} onModeChange={controls.setMode} />
      <SpecFilter query={controls.query} onQueryChange={controls.setQuery} />
      <MarkBestSwitch markBest={controls.markBest} onMarkBestChange={controls.setMarkBest} />
    </div>
  );
}

interface ModeSwitchProps {
  mode: RowMode;
  onModeChange: (mode: RowMode) => void;
}

function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  return (
    <div role="radiogroup" aria-label="Rows" className="segmented segmented-pair">
      {MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={mode === option.value}
          onClick={() => onModeChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SpecFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
}

function SpecFilter({ query, onQueryChange }: SpecFilterProps) {
  return (
    <label className="filter-field">
      <SearchIcon size={15} />
      <input
        type="search"
        placeholder="Filter specs"
        aria-label="Filter specs"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </label>
  );
}

interface MarkBestSwitchProps {
  markBest: boolean;
  onMarkBestChange: (markBest: boolean) => void;
}

function MarkBestSwitch({ markBest, onMarkBestChange }: MarkBestSwitchProps) {
  return (
    <label className="switch-row">
      Mark best values
      <input
        type="checkbox"
        role="switch"
        className="switch"
        checked={markBest}
        onChange={(event) => onMarkBestChange(event.target.checked)}
      />
    </label>
  );
}
