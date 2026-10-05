import { ICONS, type IconName } from "./icons.ts";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export type Child = Node | string;

export interface ElementOptions {
  className?: string;
  attrs?: Readonly<Record<string, string>>;
  text?: string;
}

/**
 * Builds DOM through createElement / textContent only, never innerHTML, because product
 * titles come from arbitrary web pages.
 *
 * @example new Dom(document).el("p", { className: "muted", text: product.title })
 */
export class Dom {
  constructor(readonly document: Document) {}

  el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options: ElementOptions = {},
    children: readonly Child[] = [],
  ): HTMLElementTagNameMap[K] {
    const node = this.document.createElement(tag);
    if (options.className !== undefined) node.className = options.className;
    for (const [name, value] of Object.entries(options.attrs ?? {})) node.setAttribute(name, value);
    if (options.text !== undefined) node.textContent = options.text;
    node.append(...children);
    return node;
  }

  icon(name: IconName, className: string): SVGSVGElement {
    const { viewBox, shapes } = ICONS[name];
    const svg = this.document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("class", `icon ${className}`);
    svg.setAttribute("aria-hidden", "true");
    for (const shape of shapes) svg.append(this.svgShape(shape.tag, shape.attrs));
    return svg;
  }

  private svgShape(tag: string, attrs: Readonly<Record<string, string>>): SVGElement {
    const shape = this.document.createElementNS(SVG_NAMESPACE, tag);
    for (const [name, value] of Object.entries(attrs)) shape.setAttribute(name, value);
    return shape;
  }
}
