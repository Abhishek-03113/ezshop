import type { ReactElement, ReactNode } from "react";

interface IconProps {
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly children: ReactNode;
}

/** Shared 24x24 stroke icon shell; decorative, so hidden from assistive tech. */
function Icon({ size = 20, strokeWidth = 2, children }: IconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** The Picky mascot; decorative next to the wordmark, so the alt text is empty. */
export function LogoMark({ size = 28 }: { readonly size?: number }): ReactElement {
  return <img className="logo-mark" src="/logo-128.png" width={size} height={size} alt="" />;
}

export const DownloadIcon = (): ReactElement => (
  <Icon>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </Icon>
);

export const LinkIcon = (): ReactElement => (
  <Icon size={18}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </Icon>
);

export const ArrowIcon = (): ReactElement => (
  <Icon size={32}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const CheckIcon = (): ReactElement => (
  <Icon size={18} strokeWidth={2.4}>
    <path d="M5 12l5 5 9-10" />
  </Icon>
);

export const HeadphonesIcon = (): ReactElement => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label="Product image"
  >
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4" height="7" rx="2" />
    <rect x="17" y="14" width="4" height="7" rx="2" />
  </svg>
);

/** Light bulb: lit while the theme is light. */
export const BulbIcon = ({ lit }: { readonly lit: boolean }): ReactElement => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={lit ? "currentColor" : "none"}
    fillOpacity={lit ? 0.18 : 0}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
  </svg>
);
