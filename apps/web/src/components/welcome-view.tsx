import { DocumentIcon } from "./icons.tsx";
import { ImportProductForm } from "./import-product-form.tsx";

interface WelcomeViewProps {
  extensionUrl: string;
  autoImportUrl?: string | undefined;
}

const EXTENSION_STEPS: readonly { title: string; hint: string }[] = [
  { title: "Install and pin", hint: "Keep it one click away." },
  { title: "Open a product", hint: "Amazon.in or Flipkart." },
  { title: "Click ezshop", hint: "Or press Alt + Shift + E." },
];

function ExtensionCard({ extensionUrl }: { extensionUrl: string }) {
  return (
    <section className="card extension-card" aria-labelledby="extension-title">
      <div className="extension-card-head">
        <div className="extension-card-text">
          <h2 id="extension-title">Faster: use the Chrome extension</h2>
          <span className="subtle">One click on the product page you're already on.</span>
        </div>
        <a className="soft-button" href={extensionUrl} target="_blank" rel="noreferrer">
          Add to Chrome
        </a>
      </div>
      <ol className="steps">
        {EXTENSION_STEPS.map((step, index) => (
          <li key={step.title}>
            <span className="step-number">{index + 1}</span>
            <span className="step-title">{step.title}</span>
            <span className="step-hint">{step.hint}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** First-run screen for an empty library: paste a link, or install the extension. */
export function WelcomeView({ extensionUrl, autoImportUrl }: WelcomeViewProps) {
  return (
    <main className="page narrow welcome">
      <div className="welcome-intro">
        <span className="welcome-badge">
          <DocumentIcon size={36} />
        </span>
        <h1>Welcome to ezshop</h1>
        <p>Your library is empty. Add your first product and its spec sheet will show up here.</p>
      </div>
      <ImportProductForm variant="card" autoImportUrl={autoImportUrl} />
      <ExtensionCard extensionUrl={extensionUrl} />
    </main>
  );
}
