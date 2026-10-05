import type { ReactElement, ReactNode } from "react";
import { BrowserIcon, PointerIcon, SheetIcon } from "./icons.tsx";

interface Step {
  readonly icon: ReactElement;
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
  { icon: <BrowserIcon />, title: "Open a product page", body: "Browse Amazon.in or Flipkart as you normally would." },
  {
    icon: <PointerIcon />,
    title: "Click ezshop",
    body: (
      <>
        Use the toolbar button, or press <Shortcut />.
      </>
    ),
  },
  {
    icon: <SheetIcon />,
    title: "Read the spec sheet",
    body: "It opens in a new tab and stays in your library for later.",
  },
];

/** The three-step workflow on a grouped background. */
export function HowItWorks(): ReactElement {
  return (
    <section id="how" className="how" aria-labelledby="how-title">
      <div className="section how-inner">
        <div className="section-head centered">
          <h2 id="how-title" className="h2">
            One click. That's the whole workflow.
          </h2>
          <p className="sub">No forms, no copy-paste, no account to set up first.</p>
        </div>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li className="step" key={step.title}>
              <span className="step-icon">{step.icon}</span>
              <span className="step-count">Step {index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
