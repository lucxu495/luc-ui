import { NumericFormatOptions } from "./utils/format.js";
//#region src/components/typography.d.ts
export type TextTone = "primary" | "secondary" | "muted" | "disabled" | "accent" | "inverse" | "positive" | "negative";
export type TextVariant = "body-lg" | "body" | "label" | "caption" | "micro";
export type HeadingSize = "display" | "display-sm" | "heading" | "heading-sm" | "title";
export interface TextProps extends React.ComponentPropsWithRef<"p"> {
  variant?: TextVariant;
  tone?: TextTone;
  /** Single line with an ellipsis. */
  truncate?: boolean;
  as?: "p" | "span" | "div" | "label" | "dt" | "dd" | "li";
}
export declare function Text({ className, variant, tone, truncate, as, ...props }: TextProps): import("react").JSX.Element;
export interface HeadingProps extends React.ComponentPropsWithRef<"h2"> {
  size?: HeadingSize;
  tone?: TextTone;
  as?: "h1" | "h2" | "h3" | "h4" | "div" | "span" | "p";
}
/** Headings use the display face. Only one `display` per view, please. */
export declare function Heading({ className, size, tone, as, ...props }: HeadingProps): import("react").JSX.Element;
export interface CodeProps extends React.ComponentPropsWithRef<"code"> {
  /**
   * Block form: a monospaced panel that preserves its lines and scrolls
   * horizontally rather than wrapping them.
   */
  block?: boolean;
}
export declare function Code({ className, block, ...props }: CodeProps): import("react").JSX.Element;
export interface KbdProps extends React.ComponentPropsWithRef<"kbd"> {
  /** `default` for an inline hint, `raised` for a shortcut strip. */
  variant?: "default" | "raised";
  size?: "sm" | "md";
}
export declare function Kbd({ className, variant, size, ...props }: KbdProps): import("react").JSX.Element;
export interface NumericTextProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  value: number | null | undefined;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  suffix?: string;
  signed?: boolean;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}
/**
 * Numeric text with guaranteed stable width.
 *
 * Digits use tabular figures and a non-breaking grouping character so a
 * changing value never reflows its surroundings. This is the primitive every
 * metric, price and percentage is built from.
 */
export declare function NumericText({ className, value, kind, currency, suffix, signed, locale, minimumFractionDigits, maximumFractionDigits, ...props }: NumericTextProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=typography.d.ts.map