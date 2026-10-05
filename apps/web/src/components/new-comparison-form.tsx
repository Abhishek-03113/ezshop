import { useState, type FormEvent } from "react";

interface NewComparisonFormProps {
  /** Pre-filled name, e.g. the product's category. */
  initialName?: string;
  isPending: boolean;
  errorMessage: string | null;
  onCreate: (name: string) => void;
  onCancel: () => void;
}

/** Inline "name it, then create" row shared by the sidebar and the product page. */
export function NewComparisonForm({
  initialName = "",
  isPending,
  errorMessage,
  onCreate,
  onCancel,
}: NewComparisonFormProps) {
  const [name, setName] = useState(initialName);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() !== "") onCreate(name.trim());
  };
  return (
    <form className="new-comparison-form" onSubmit={submit}>
      <NameInput name={name} onNameChange={setName} onCancel={onCancel} />
      <FormButtons canCreate={!isPending && name.trim() !== ""} isPending={isPending} onCancel={onCancel} />
      {errorMessage !== null && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

interface NameInputProps {
  name: string;
  onNameChange: (name: string) => void;
  onCancel: () => void;
}

function NameInput({ name, onNameChange, onCancel }: NameInputProps) {
  return (
    <>
      <label className="visually-hidden" htmlFor="new-comparison-name">
        Comparison name
      </label>
      <input
        id="new-comparison-name"
        autoFocus
        required
        maxLength={120}
        placeholder="Name this comparison"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
      />
    </>
  );
}

interface FormButtonsProps {
  canCreate: boolean;
  isPending: boolean;
  onCancel: () => void;
}

function FormButtons({ canCreate, isPending, onCancel }: FormButtonsProps) {
  return (
    <>
      <button type="submit" className="pill-button" disabled={!canCreate}>
        {isPending ? "Creating…" : "Create"}
      </button>
      <button type="button" className="text-button" onClick={onCancel}>
        Cancel
      </button>
    </>
  );
}
