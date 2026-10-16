import { cn } from "../utils/cn";
import { splitNumberParts, type NumericFormatOptions } from "../utils/format";

export type TextTone = "primary" | "secondary" | "muted" | "disabled" | "accent" | "inverse" | "positive" | "negative";
export type TextVariant = "body-lg" | "body" | "label" | "caption" | "micro";
export type HeadingSize = "display" | "display-sm" | "heading" | "heading-sm" | "title";

const toneClass: Record<TextTone, string> = {
  primary: "text-fg-primary",
  secondary: "text-fg-secondary",
  muted: "text-fg-muted",
  disabled: "text-fg-disabled",
  accent: "text-fg-accent",
  inverse: "text-fg-inverse",
  positive: "text-fg-positive",
  negative: "text-fg-negative",
};

const variantClass: Record<TextVariant, string> = {
  "body-lg": "text-body-lg",
  body: "text-body",
  label: "text-label",
  caption: "text-caption",
  micro: "text-micro uppercase",
};

const headingClass: Record<HeadingSize, string> = {
  display: "text-display font-display",
  "display-sm": "text-display-sm font-display",
  heading: "text-heading font-display",
  "heading-sm": "text-heading-sm font-display",
  title: "text-title",
};

export interface TextProps extends React.ComponentPropsWithRef<"p"> {
  variant?: TextVariant;
  tone?: TextTone;
  /** Single line with an ellipsis. */
  truncate?: boolean;
  as?: "p" | "span" | "div" | "label" | "dt" | "dd" | "li";
}

export function Text({
  className,
  variant = "body",
  tone = "primary",
  truncate,
  as = "p",
  ...props
}: TextProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      data-slot="text"
      className={cn(variantClass[variant], toneClass[tone], truncate && "truncate", className)}
      {...props}
    />
  );
}

export interface HeadingProps extends React.ComponentPropsWithRef<"h2"> {
  size?: HeadingSize;
  tone?: TextTone;
  as?: "h1" | "h2" | "h3" | "h4" | "div" | "span" | "p";
}

/** Headings use the display face. Only one `display` per view, please. */
export function Heading({ className, size = "heading-sm", tone = "primary", as = "h2", ...props }: HeadingProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      data-slot="heading"
      className={cn(headingClass[size], toneClass[tone], "text-balance", className)}
      {...props}
    />
  );
}

export interface CodeProps extends React.ComponentPropsWithRef<"code"> {
  /**
   * Block form: a monospaced panel that preserves its lines and scrolls
   * horizontally rather than wrapping them.
   */
  block?: boolean;
}

export function Code({ className, block = false, ...props }: CodeProps) {
  if (block) {
    /*
     * Scrollable on purpose, and focusable because of it.
     *
     * A block of code that wraps does not stay readable: the wrap lands
     * mid-token, and any comment or column aligned to the right of a long line
     * detaches from the statement it explains — which is how a snippet that was
     * correct in the editor arrives looking broken on the page. The line is the
     * unit of meaning in source, so the line is preserved and the box scrolls.
     *
     * Every other code surface in this system (`Demo`, the install block, the
     * Playground) already does exactly this. Only the tab stop is new: a region
     * that scrolls and cannot be reached from the keyboard is unreachable
     * content, so it joins the tab order.
     *
     * `contain: inline-size` is the other half, and it is not decoration. A
     * block-level scroller still reports its widest line as its min-content
     * contribution, so inside an auto-sized grid track or a shrink-to-fit
     * column it stretches the parent instead of scrolling inside it — which is
     * exactly how a long snippet turned a two-column demo into a
     * horizontally-scrollable page. Inline-size containment makes the element's
     * width independent of its contents: the box is the page's to size, the
     * line is the reader's to scroll.
     */
    return (
      <code
        data-slot="code"
        tabIndex={0}
        className={cn(
          "block overflow-x-auto rounded-md border border-line-subtle bg-surface-sunken p-3 whitespace-pre [contain:inline-size] [scrollbar-gutter:stable]",
          "font-mono text-caption leading-relaxed text-fg-secondary",
          className,
        )}
        {...props}
      />
    );
  }
  return (
    <code
      data-slot="code"
      className={cn(
        "rounded-xs border border-line-subtle bg-surface-sunken px-1 py-px",
        "font-mono text-[0.92em] text-fg-secondary",
        className,
      )}
      {...props}
    />
  );
}

export interface KbdProps extends React.ComponentPropsWithRef<"kbd"> {
  /** `default` for an inline hint, `raised` for a shortcut strip. */
  variant?: "default" | "raised";
  size?: "sm" | "md";
}

export function Kbd({ className, variant = "default", size = "md", ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex items-center justify-center gap-0.5 rounded-xs luc-numeric",
        "border border-line-default bg-surface-interactive px-1",
        "font-mono text-fg-muted",
        size === "sm" ? "h-4 min-w-4 text-[9px]" : "h-[18px] min-w-[18px] text-[10px]",
        /* A raised key reads as a physical keycap: the surface steps up and the
           shadow sits under it, which is the same rung the Button uses. */
        variant === "raised" ? "shadow-rest" : "shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

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
export function NumericText({
  className,
  value,
  kind = "number",
  currency,
  suffix,
  signed,
  locale,
  minimumFractionDigits,
  maximumFractionDigits,
  ...props
}: NumericTextProps) {
  const parts = splitNumberParts(value, {
    kind,
    currency,
    suffix,
    signed,
    locale,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return (
    <span
      data-slot="numeric-text"
      data-numeric
      className={cn("luc-numeric tabular-nums", className)}
      {...props}
    >
      {value === null || value === undefined || !Number.isFinite(value) ? "—" : parts.formatted}
    </span>
  );
}
