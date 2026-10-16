import { cn } from "../utils/cn";
import { Card } from "../components/card";
import { Delta } from "./delta";
import { MetricValue, type MetricSize } from "./metric";
import type { NumericFormatOptions } from "../utils/format";

export interface StatCardProps extends Omit<React.ComponentPropsWithRef<"div">, "children"> {
  label: React.ReactNode;
  value: number | null | undefined;
  /** Period-over-period change, rendered as a `Delta`. */
  delta?: number | null;
  deltaLabel?: React.ReactNode;
  invertDelta?: boolean;
  /** Small leading slot: icon, status dot, or asset mark. */
  icon?: React.ReactNode;
  /** Right-aligned slot on the header row. */
  aside?: React.ReactNode;
  /** Chart or visualisation slot under the value. */
  visual?: React.ReactNode;
  /** Footer line: freshness, provenance, unit. */
  footer?: React.ReactNode;
  size?: MetricSize;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  suffix?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  selected?: boolean;
  interactive?: boolean;
}

// LUC StatCard — a Card that knows how to present one number well.
export function StatCard({
  className,
  label,
  value,
  delta,
  deltaLabel,
  invertDelta = false,
  icon,
  aside,
  visual,
  footer,
  size = "lg",
  kind,
  currency,
  suffix,
  minimumFractionDigits,
  maximumFractionDigits,
  selected = false,
  interactive = false,
  ...props
}: StatCardProps) {
  return (
    <Card
      data-slot="stat-card"
      variant="raised"
      selected={selected}
      interactive={interactive}
      className={cn("gap-3 p-4", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-micro text-fg-muted uppercase">
          {icon ? <span className="text-fg-disabled [&_svg]:size-3.5">{icon}</span> : null}
          {label}
        </span>
        {aside}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
        <MetricValue
          value={value}
          size={size}
          kind={kind}
          currency={currency}
          suffix={suffix}
          minimumFractionDigits={minimumFractionDigits}
          maximumFractionDigits={maximumFractionDigits}
        />
        {delta !== undefined ? (
          <span className="flex items-center gap-1.5 pb-1">
            <Delta value={delta} invert={invertDelta} />
            {deltaLabel ? <span className="text-caption text-fg-muted">{deltaLabel}</span> : null}
          </span>
        ) : null}
      </div>
      {visual ? <div className="min-h-0">{visual}</div> : null}
      {footer ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-2.5 text-caption text-fg-muted">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
