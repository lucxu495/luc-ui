import { cn } from "../utils/cn";
import { formatNumber, resolveDeltaTone, type NumericFormatOptions } from "../utils/format";

export interface DeltaProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  value: number | null | undefined;
  /** Percent change (default), absolute change, or fully custom. */
  variant?: "percent" | "absolute";
  /** Treat a decrease as good — latency, error rate, drawdown. */
  invert?: boolean;
  /** Append the unit for absolute deltas. */
  suffix?: string;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  /** Show the arrow glyph. Default `true`. */
  arrow?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClass = { sm: "text-caption", md: "text-label", lg: "text-body" } as const;
const toneClass = {
  positive: "text-fg-positive",
  negative: "text-fg-negative",
  neutral: "text-fg-muted",
} as const;

// LUC Delta.
//
// Direction is carried by colour *and* a glyph, never colour alone — colour
// blindness and screenshots both deserve the same information.
export function Delta({
  className,
  value,
  variant = "percent",
  invert = false,
  suffix,
  kind,
  currency,
  arrow = true,
  size = "md",
  ...props
}: DeltaProps) {
  const tone = resolveDeltaTone(value, invert);
  const text = formatNumber(value, {
    // An absolute delta on a small number ("+0.18 Sharpe") must not round to 0.
    kind: kind ?? (variant === "percent" ? "percent" : "decimal"),
    currency,
    suffix,
    signed: true,
  });

  return (
    <span
      data-slot="delta"
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-1 font-medium luc-numeric",
        toneClass[tone],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {arrow && tone !== "neutral" ? (
        <svg viewBox="0 0 12 12" aria-hidden="true" className="size-2.5 shrink-0">
          {tone === "positive" ? (
            <path d="M6 2.2L10 8.6H2z" fill="currentColor" />
          ) : (
            <path d="M6 9.8L2 3.4h8z" fill="currentColor" />
          )}
        </svg>
      ) : null}
      {text}
    </span>
  );
}
