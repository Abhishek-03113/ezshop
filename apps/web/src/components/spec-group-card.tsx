import { type SpecGroup, specGroupAnchor } from "@ezshop/catalog";

/** One titled group of label/value specs as a description list. */
export function SpecGroupCard({ group }: { group: SpecGroup }) {
  return (
    <section id={specGroupAnchor(group.title)} className="card spec-group">
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
