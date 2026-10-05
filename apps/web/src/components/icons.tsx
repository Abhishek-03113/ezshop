import type { ReactNode } from "react";

interface IconProps {
  size?: number;
}

interface StrokeIconProps extends IconProps {
  strokeWidth: number;
  children: ReactNode;
}

function StrokeIcon({ size = 16, strokeWidth, children }: StrokeIconProps) {
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

/** ezshop mark: blue rounded square with three lines. */
export function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="var(--ez-blue)" />
      <path d="M8 10h12M8 14h8M8 18h10" stroke="var(--ez-on-accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LinkIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size} strokeWidth={2}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </StrokeIcon>
  );
}

export function SearchIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </StrokeIcon>
  );
}

export function ChevronLeftIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size} strokeWidth={2.2}>
      <path d="M15 5l-7 7 7 7" />
    </StrokeIcon>
  );
}

export function ExternalLinkIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size} strokeWidth={2.2}>
      <path d="M7 17L17 7M9 7h8v8" />
    </StrokeIcon>
  );
}

export function DocumentIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size} strokeWidth={1.8}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13h6M10 17h4" />
    </StrokeIcon>
  );
}

/** Stand-in when a product has no image. */
export function BoxIcon({ size }: IconProps) {
  return (
    <StrokeIcon size={size} strokeWidth={1.4}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </StrokeIcon>
  );
}

export function StarIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--ez-orange)" aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}
