import { cn } from "../utils/cn";
import { formatNumber, type NumericFormatOptions } from "../utils/format";
import { NumberTicker } from "../motion/number-ticker";

export type MetricSize = "sm" | "md" | "lg" | "xl";

const valueSize: Record<MetricSize, string> = {
  sm: "text-title",
  md: "text-heading-sm",
  lg: "text-heading",
  xl: "text-display-sm",
};

export interface MetricProps extends React.ComponentPropsWithRef<"div"> {
  label: React.ReactNode;
  /** Secondary line under the value: a delta, a timestamp, a unit note. */
  meta?: React.ReactNode;
  /** Right-aligned slot for a comparison, status or timeframe control. */
  aside?: React.ReactNode;
}

// LUC Metric — the generic label/value block.
//
// Renders "Revenue / $128,431 / +12.4% / updated 3m ago" and
// "BTC Price / $109,241 / +2.1% / Sep 25" from the same code path. Nothing here
// knows about finance.
export function Metric({ className, label, meta, aside, children, ...props }: MetricProps) {
  return (
    <div data-slot="metric" className={cn("flex min-w-0 flex-col gap-1.5", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-micro text-fg-muted uppercase">{label}</span>
        {aside}
      </div>
      {children}
      {meta ? <div className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">{meta}</div> : null}
    </div>
  );
}

export interface MetricValueProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  value: number | null | undefined;
  size?: MetricSize;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  suffix?: string;
  signed?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
  /** Roll to the new value instead of snapping. Default `true`. */
  animate?: boolean;
  /**
   * How the roll works. `digits` (default) moves only the digits that changed;
   * `count` rolls the whole number, which is calmer on very long values.
   */
  variant?: "count" | "digits";
  /** Use the display face for headline numbers. Default `true`. */
  display?: boolean;
  /** Replace the built-in formatter entirely. */
  format?: (value: number) => string;
}

export function MetricValue({
  className,
  value,
  size = "lg",
  kind = "number",
  currency,
  suffix,
  signed,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
  animate = true,
  variant = "digits",
  display = true,
  format,
  ...props
}: MetricValueProps) {
  const classes = cn(
    valueSize[size],
    display && "font-display",
    "font-semibold text-fg-primary luc-numeric",
    className,
  );

  if (!animate) {
    return (
      <span data-slot="metric-value" data-numeric className={classes} {...props}>
        {format
          ? value === null || value === undefined || !Number.isFinite(value)
            ? "—"
            : format(value)
          : formatNumber(value, {
              kind,
              currency,
              suffix,
              signed,
              locale,
              minimumFractionDigits,
              maximumFractionDigits,
            })}
      </span>
    );
  }

  return (
    <NumberTicker
      data-slot="metric-value"
      className={classes}
      value={value}
      kind={kind}
      currency={currency}
      suffix={suffix}
      signed={signed}
      locale={locale}
      minimumFractionDigits={minimumFractionDigits}
      maximumFractionDigits={maximumFractionDigits}
      variant={variant}
      format={format}
      {...props}
    />
  );
}
