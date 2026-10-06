import { useState } from "react";
import { useCreateComparison } from "../hooks/use-comparison-mutations.ts";
import { PlusIcon } from "./icons.tsx";
import { NewComparisonForm } from "./new-comparison-form.tsx";

interface NewComparisonEntryProps {
  /** The sidebar shows a quiet text row ("side-new"); the comparisons index a pill button. */
  buttonClassName: string;
}

/**
 * "New comparison" button that turns into the name form; creating opens the new, empty comparison.
 *
 * @example <NewComparisonEntry buttonClassName="side-new" />
 */
export function NewComparisonEntry({ buttonClassName }: NewComparisonEntryProps) {
  const [editing, setEditing] = useState(false);
  const createComparison = useCreateComparison();
  if (!editing) {
    return (
      <button type="button" className={buttonClassName} onClick={() => setEditing(true)}>
        <PlusIcon size={16} />
        New comparison
      </button>
    );
  }
  return (
    <NewComparisonForm
      isPending={createComparison.isPending}
      errorMessage={createComparison.isError ? createComparison.error.message : null}
      onCreate={(name) => createComparison.mutate({ name, productIds: [] })}
      onCancel={() => setEditing(false)}
    />
  );
}
