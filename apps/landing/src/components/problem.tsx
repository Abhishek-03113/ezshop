import type { ReactElement } from "react";

/** One-paragraph statement of the problem, straight from the product vision. */
export function Problem(): ReactElement {
  return (
    <section className="section problem" aria-labelledby="problem-title">
      <h2 id="problem-title" className="h2">
        The information is there. It's just scattered.
      </h2>
      <p className="sub">
        A product page holds hundreds of details, buried under offers, financing and ads. Comparing two means two tabs
        and a good memory. Shopping sites are built to sell one product, not to help you choose between several.
      </p>
    </section>
  );
}
