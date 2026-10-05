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

export function LogoMark(): ReactElement {
  return (
    <svg className="logo-mark" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="currentColor" />
      <path d="M8 10h12M8 14h8M8 18h10" stroke="var(--ez-on-accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
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

export const BrowserIcon = (): ReactElement => (
  <Icon size={22}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M3 9h18" />
  </Icon>
);

export const PointerIcon = (): ReactElement => (
  <Icon size={22}>
    <path d="M9 4l10 9-5 1 3 6-2 1-3-6-3 4z" />
  </Icon>
);

export const SheetIcon = (): ReactElement => (
  <Icon size={22}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M10 13h6M10 17h4" />
  </Icon>
);
