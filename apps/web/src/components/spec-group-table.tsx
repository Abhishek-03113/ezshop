import type { SpecGroup } from "@ezshop/catalog";

interface SpecGroupTableProps {
  group: SpecGroup;
  featured?: boolean;
}

/** One titled group of label/value specs as a two-column table. */
export function SpecGroupTable({ group, featured = false }: SpecGroupTableProps) {
  return (
    <section className={featured ? "spec-group featured" : "spec-group"}>
      <h3>
        {group.title} <span className="count">{group.specs.length}</span>
      </h3>
      <table>
        <tbody>
          {group.specs.map((spec) => (
            <tr key={`${spec.label}:${spec.value}`}>
              <th scope="row">{spec.label}</th>
              <td>{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
