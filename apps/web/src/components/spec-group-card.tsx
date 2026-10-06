import { type SpecGroup, specGroupAnchor } from "@ezshop/catalog";

/** One titled group of label/value specs as a description list; `highlighted` rings it after a chip jump. */
export function SpecGroupCard({ group, highlighted = false }: { group: SpecGroup; highlighted?: boolean }) {
  return (
    <section
      id={specGroupAnchor(group.title)}
      className={highlighted ? "card spec-group highlighted" : "card spec-group"}
    >
      <h3>{group.title}</h3>
      <dl>
        {group.specs.map((spec) => (
          <div className="spec-row" key={`${spec.label}:${spec.value}`}>
            <dt>{spec.label}</dt>
            <dd>{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
