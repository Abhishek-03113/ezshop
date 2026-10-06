import type { ComparisonCell } from "@picky/catalog";

interface MatrixCellProps {
  cell: ComparisonCell;
  /** False when "Mark best values" is off: best cells then look like any other. */
  markBest: boolean;
  /** Pill text for the best cell, e.g. "Best" or "Lowest"; null for plain bold. */
  pill: string | null;
}

/** One value in a matrix row: "—" for a missing spec, bold plus an optional pill for the best value. */
export function MatrixCell({ cell, markBest, pill }: MatrixCellProps) {
  if (cell.text === null)
    return (
      <div role="cell" className="mx-value none">
        —
      </div>
    );
  const best = markBest && cell.isBest;
  return (
    <div role="cell" className={best ? "mx-value best" : "mx-value"}>
      {cell.text}
      {best && pill !== null && <span className="best-pill">{pill}</span>}
    </div>
  );
}

interface MatrixRowProps {
  label: string;
  cells: readonly ComparisonCell[];
  markBest: boolean;
  pill: string | null;
}

/** A full matrix row: the label column then one cell per product. */
export function MatrixRow({ label, cells, markBest, pill }: MatrixRowProps) {
  return (
    <div role="row" className="mx-row">
      <div role="rowheader" className="mx-label">
        {label}
      </div>
      {cells.map((cell, column) => (
        <MatrixCell key={column} cell={cell} markBest={markBest} pill={pill} />
      ))}
    </div>
  );
}
