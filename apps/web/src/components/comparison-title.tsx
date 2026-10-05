import { useState, type FormEvent } from "react";

interface ComparisonTitleProps {
  name: string;
  onRename: (name: string) => void;
}

/** The page's h1; click it to rename in place. Enter or leaving the field saves, Escape cancels. */
export function ComparisonTitle({ name, onRename }: ComparisonTitleProps) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <h1 className="page-title">
        <button type="button" className="title-button" title="Rename" onClick={() => setEditing(true)}>
          {name}
        </button>
      </h1>
    );
  }
  return (
    <TitleEditor
      name={name}
      onDone={(next) => {
        setEditing(false);
        if (next !== name) onRename(next);
      }}
    />
  );
}

function TitleEditor({ name, onDone }: { name: string; onDone: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  const finish = () => onDone(draft.trim() === "" ? name : draft.trim());
  const submit = (event: FormEvent) => {
    event.preventDefault();
    finish();
  };
  return (
    <form onSubmit={submit}>
      <input
        autoFocus
        className="title-input"
        aria-label="Comparison name"
        maxLength={120}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={finish}
        onKeyDown={(event) => event.key === "Escape" && onDone(name)}
      />
    </form>
  );
}
