export interface IconShape {
  tag: "path" | "rect" | "circle";
  attrs: Readonly<Record<string, string>>;
}

export interface IconDefinition {
  viewBox: string;
  shapes: readonly IconShape[];
}

const path = (d: string): IconShape => ({ tag: "path", attrs: { d } });
const rect = (x: number, y: number, width: number, height: number, rx: number): IconShape => ({
  tag: "rect",
  attrs: { x: String(x), y: String(y), width: String(width), height: String(height), rx: String(rx) },
});
const circle = (r: number): IconShape => ({ tag: "circle", attrs: { cx: "12", cy: "12", r: String(r) } });

/** Stroke icons share a 24x24 grid; styling (colour, stroke width) lives in popup.css. */
export const ICONS = {
  logo: { viewBox: "0 0 28 28", shapes: [rect(0, 0, 28, 28, 8), path("M8 10h12M8 14h8M8 18h10")] },
  library: {
    viewBox: "0 0 24 24",
    shapes: [rect(3, 3, 7, 7, 2), rect(14, 3, 7, 7, 2), rect(3, 14, 7, 7, 2), rect(14, 14, 7, 7, 2)],
  },
  check: { viewBox: "0 0 24 24", shapes: [path("M5 12l5 5 9-10")] },
  headphones: {
    viewBox: "0 0 24 24",
    shapes: [path("M4 15v-3a8 8 0 0 1 16 0v3"), rect(3, 14, 4, 7, 2), rect(17, 14, 4, 7, 2)],
  },
  arrowUpRight: { viewBox: "0 0 24 24", shapes: [path("M7 17L17 7M9 7h8v8")] },
  noProduct: {
    viewBox: "0 0 24 24",
    shapes: [{ tag: "circle", attrs: { cx: "11", cy: "11", r: "7" } }, path("M20 20l-4-4M9 9l4 4M13 9l-4 4")],
  },
  alert: { viewBox: "0 0 24 24", shapes: [circle(9), path("M12 7.5v5.5M12 16.5v.01")] },
  spinner: { viewBox: "0 0 24 24", shapes: [circle(9), path("M21 12a9 9 0 0 0-9-9")] },
  close: { viewBox: "0 0 24 24", shapes: [path("M6 6l12 12M18 6L6 18")] },
  plus: { viewBox: "0 0 24 24", shapes: [path("M12 5v14M5 12h14")] },
  chevronDown: { viewBox: "0 0 24 24", shapes: [path("M6 9l6 6 6-6")] },
  pending: { viewBox: "0 0 24 24", shapes: [circle(8)] },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;
