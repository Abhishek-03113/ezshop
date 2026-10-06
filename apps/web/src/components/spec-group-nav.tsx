import { type SpecGroup, specGroupAnchor } from "@ezshop/catalog";

/** Chips that jump to each visible group, with its spec count. */
export function SpecGroupNav({ groups }: { groups: readonly SpecGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <nav aria-label="Spec groups" className="group-chips">
      {groups.map((group) => (
        <a key={group.title} href={`#${specGroupAnchor(group.title)}`}>
          {group.title} <span className="count">{group.specs.length}</span>
        </a>
      ))}
    </nav>
  );
}
