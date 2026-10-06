import type { ReactElement, ReactNode } from "react";

interface Step {
  readonly title: string;
  readonly body: ReactNode;
}

const SHORTCUT_KEYS: readonly string[] = ["Alt", "Shift", "E"];

function Shortcut(): ReactElement {
  return (
    <>
      {SHORTCUT_KEYS.map((key, index) => (
        <span key={key}>
          {index > 0 && " "}
          <kbd>{key}</kbd>
        </span>
      ))}
    </>
  );
}

const STEPS: readonly Step[] = [
  {
    title: "Save",
    body: (
      <>
        Click Picky on any product page, or press <Shortcut />. Nothing to copy, and you never leave the page.
      </>
    ),
  },
  {
    title: "Understand",
    body: "Every product opens as the same grouped spec sheet, free of store layouts and promotional noise.",
  },
  {
    title: "Compare",
    body: "Put your shortlist side by side. See what they share, where they differ and where one clearly wins.",
  },
  { title: "Decide", body: "You make the call. Your research stays in your library for whenever you come back." },
];

/** The save, understand, compare, decide sequence as a plain ordered list. */
export function HowItWorks(): ReactElement {
  return (
    <section id="how" className="section how" aria-labelledby="how-title">
      <h2 id="how-title" className="h2">
        Between finding a product and buying it.
      </h2>
      <ol className="steps">
        {STEPS.map((step, index) => (
          <li className="step" key={step.title}>
            <span className="step-count" aria-hidden="true">
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
