"use client";

import { useId } from "react";
import { cn } from "../../utils/cn";
import { ChartEmptyState } from "../chart-card";

/**
 * Historical-position / percentile readout.
 *
 * A rolling return's *percentile* answers a different question from its level:
 * "is this reading high or ordinary for this asset's own history?" A generic
 * line chart of the same series cannot say that, and a gauge/dial implies a
 * recommendation the number does not carry. This component draws the honest
 * thing — a 0–100 track with the conventional quantile ticks and a single marker
 * at the served percentile — so a research page can state "the current 90-day
 * return sits at the 78th percentile of its own history" at a glance.
 *
 * It is presentation only and deliberately engine-free: the percentile and the
 * formatted value are provided by the caller (from the served payload); nothing
 * here computes a statistic, and nothing interprets the position as bullish or
 * bearish.
 */

export type HistoricalPositionTone = "accent" | "positive" | "negative" | "neutral" | "warning";

export interface HistoricalPositionChartProps {
  /** The served percentile, 0–100. Values outside the range are clamped. */
  percentile: number | null | undefined;
  /** The formatted current reading, shown beside the marker. */
  value?: string | null;
  /** The quantile ticks to label. Defaults to the conventional deciles. */
  ticks?: readonly number[];
  /** A spoken label for the current percentile, e.g. "78th percentile". */
  percentileLabel?: string | null;
  tone?: HistoricalPositionTone;
  /** Box height, in CSS pixels. Defaults to the compact readout band. */
  height?: number;
  ariaLabel?: string;
  ariaDescription?: string;
  className?: string;
}

const DEFAULT_TICKS = [10, 25, 50, 75, 90] as const;

/**
 * How close to an end the marker may be before the readout stops centring on it
 * and aligns to the container edge instead. Twelve percent is roughly the width
 * of "78th percentile" at this type size.
 */
const EDGE_PERCENT = 12;

const TONE_VAR: Record<HistoricalPositionTone, string> = {
  accent: "var(--chart-series-1)",
  positive: "var(--chart-positive)",
  negative: "var(--chart-negative)",
  neutral: "var(--chart-neutral)",
  warning: "var(--chart-warning, var(--chart-neutral))",
};

function clampPercentile(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

export function HistoricalPositionChart({
  percentile,
  value,
  ticks = DEFAULT_TICKS,
  percentileLabel,
  tone = "accent",
  height = 96,
  ariaLabel,
  ariaDescription,
  className,
}: HistoricalPositionChartProps) {
  const position = clampPercentile(percentile);
  const label = ariaLabel ?? "Historical position";
  const descriptionId = useId();

  if (position === null) {
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ChartEmptyState title="No percentile" description="This reading has no historical position yet." />
      </div>
    );
  }

  const markerColor = TONE_VAR[tone];
  const summary = [percentileLabel, value].filter((entry): entry is string => Boolean(entry)).join(" · ");
  const description = ariaDescription ?? (summary || `${Math.round(position)} percent`);

  return (
    <div
      role="img"
      aria-label={label}
      aria-describedby={descriptionId}
      data-slot="historical-position"
      className={cn("relative w-full select-none", className)}
      style={{ height }}
    >
      <span id={descriptionId} className="sr-only">
        {description}
      </span>
      <div className="absolute inset-x-0 top-[46%] h-2 -translate-y-1/2 overflow-hidden rounded-full bg-line-subtle">
        <div
          aria-hidden="true"
          className="h-full rounded-full"
          style={{ width: `${position}%`, background: markerColor, opacity: 0.28 }}
        />
      </div>
      {ticks.map((tick) => (
        <div
          key={tick}
          className="absolute top-[46%] -translate-y-1/2"
          style={{ left: `${Math.max(0, Math.min(100, tick))}%` }}
        >
          <span aria-hidden="true" className="block h-3 w-px -translate-x-1/2 bg-line-strong" />
          <span className="absolute left-0 top-4 -translate-x-1/2 text-micro text-fg-muted luc-numeric">
            {tick}
          </span>
        </div>
      ))}
      <div
        aria-hidden="true"
        className="absolute top-[46%] -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${position}%` }}
      >
        <span
          className="block h-4 w-4 rounded-full border-2 border-surface-raised shadow-sm"
          style={{ background: markerColor }}
        />
      </div>
      {(value || percentileLabel) && (
        <div
          /*
           * The readout is anchored *and clamped*.
           *
           * It used to be centred on `left: {position}%` with no bounds, so at 78%
           * its text sat directly on top of the 75 tick label, and at 2% or 99% it
           * hung half outside the container. Near an edge the block now aligns to
           * that edge instead of to the marker, which is the standard treatment for
           * a slider bubble, and it sits above the band so it never reaches the
           * tick row.
           */
          className="absolute bottom-[54%] whitespace-nowrap"
          style={{
            ...(position < EDGE_PERCENT
              ? { left: 0, textAlign: "left" }
              : position > 100 - EDGE_PERCENT
                ? { right: 0, textAlign: "right" }
                : { left: `${position}%`, transform: "translateX(-50%)", textAlign: "center" }),
          }}
        >
          {value ? <span className="block text-caption font-medium text-fg-primary luc-numeric">{value}</span> : null}
          {percentileLabel ? <span className="block text-micro text-fg-muted">{percentileLabel}</span> : null}
        </div>
      )}
    </div>
  );
}
