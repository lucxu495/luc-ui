//#region src/experiences/social-links.d.ts
/**
 * LUC SocialLinks — the row of "where else to find me" links under a profile.
 *
 * It is small and it is easy to get wrong in the same three ways: an icon-only
 * link with no accessible name, a link that opens a new tab with no warning, and
 * a list of `<div>`s that a screen reader reads as a run-on sentence. This
 * component exists so a product gets all three right without thinking about it.
 *
 * The handle is the point of the row — a link to `github.com/ada` should read
 * "GitHub, ada", not "GitHub" — so `handle` is rendered as text and folded into
 * the accessible name rather than being decorative.
 */
export interface SocialLink {
  id: string;
  /** Service or destination name, always visible. "GitHub", "ORCID", "Email". */
  label: string;
  href: string;
  /** Account handle, address or id: `ada`, `0000-0002-1825-0097`. */
  handle?: string;
  /** Leading glyph. Rendered `aria-hidden`; the label carries the meaning. */
  icon?: React.ReactNode;
  /** Default `true` for absolute URLs, `false` for `mailto:`/`tel:`/relative. */
  external?: boolean;
  /** Screen-reader hint appended to the name. Default "opens in a new tab". */
  externalHint?: string;
}
export interface SocialLinksProps extends Omit<React.ComponentPropsWithRef<"ul">, "children"> {
  links: readonly SocialLink[];
  /** `row` wraps; `column` stacks for a narrow sidebar. Default `row`. */
  orientation?: "row" | "column";
  /** Show the handle next to the label. Default `true`. */
  withHandles?: boolean;
  size?: "sm" | "md";
  /** Accessible name for the list. Default "Profiles and contact". */
  label?: string;
}
export declare function SocialLinks({ links, orientation, withHandles, size, label, className, ...props }: SocialLinksProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=social-links.d.ts.map