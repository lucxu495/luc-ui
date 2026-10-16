"use client";

import { useId, useMemo } from "react";
import { cn } from "../../utils/cn";
import { clamp } from "../../utils/format";

export type SparkTone = "accent" | "positive" | "negative" | "warning" | "neutral";

const TONE_VAR: Record<SparkTone, string> = {
  accent: "var(--accent-default)",
  positive: "var(--positive)",
  negative: "var(--negative)",
  warning: "var(--warning)",
  neutral: "var(--fg-muted)",
};

export interface SparklineProps {
  values: readonly (number | null)[];
  tone?: SparkTone;
  /** Derive the tone from the first/last values — the dashboard convention. */
  autoTone?: boolean;
  fill?: boolean;
  marker?: boolean;
  strokeWidth?: number;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

interface Segment {
  points: Array<[number, number]>;
}

function buildGeometry(values: readonly (number | null)[], width: number, height: number, pad: number) {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (finite.length < 2) return { segments: [] as Segment[], last: null as [number, number] | null };
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  const segments: Segment[] = [];
  let current: Array<[number, number]> = [];
  values.forEach((value, index) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      if (current.length > 1) segments.push({ points: current });
      current = [];
      return;
    }
    const x = index * stepX;
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    current.push([x, y]);
  });
  if (current.length > 1) segments.push({ points: current });
  const lastSegment = segments[segments.length - 1];
  return { segments, last: lastSegment?.points[lastSegment.points.length - 1] ?? null };
}

function toPath(points: Array<[number, number]>): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

/**
 * Sparkline.
 *
 * No engine, no axis, no interaction: 8–60 points drawn as an SVG path. Keeping
 * this out of ECharts means a table of sixty rows costs sixty cheap SVG paths
 * rather than sixty chart instances.
 */
export function Sparkline({
  values,
  tone = "accent",
  autoTone = false,
  fill = false,
  marker = false,
  strokeWidth = 1.5,
  width = 240,
  height = 48,
  className,
  ariaLabel,
}: SparklineProps) {
  const gradientId = useId();
  const pad = strokeWidth + 1;

  const resolvedTone: SparkTone = useMemo(() => {
    if (!autoTone) return tone;
    const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const first = finite[0];
    const last = finite[finite.length - 1];
    if (first === undefined || last === undefined) return "neutral";
    if (last > first) return "positive";
    if (last < first) return "negative";
    return "neutral";
  }, [autoTone, tone, values]);

  const { segments, last } = useMemo(
    () => buildGeometry(values, width, height, pad),
    [height, pad, values, width],
  );

  if (segments.length === 0) {
    return <div className={cn("h-12 w-full rounded-sm bg-surface-sunken", className)} aria-hidden="true" />;
  }

  const color = TONE_VAR[resolvedTone];
  const areaPath =
    fill && segments.length === 1
      ? `${toPath(segments[0]!.points)} L${width} ${height} L0 ${height} Z`
      : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
      {segments.map((segment, index) => (
        <path
          key={index}
          d={toPath(segment.points)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {marker && last ? <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} /> : null}
    </svg>
  );
}

/** Sparkline with a soft fill — the stat-card default. */
export function SparkArea(props: SparklineProps) {
  return <Sparkline {...props} fill marker={props.marker ?? true} />;
}

export interface MiniBarProps {
  values: readonly (number | null)[];
  tone?: SparkTone;
  autoTone?: boolean;
  height?: number;
  className?: string;
  ariaLabel?: string;
  /** Fraction of the slot the bar occupies. */
  gap?: number;
}

/**
 * Mini bar chart for watchlist rows and table cells. Values are scaled from
 * zero, because a bar chart with a non-zero baseline lies.
 */
export function MiniBar({
  values,
  tone = "accent",
  autoTone = false,
  height = 32,
  className,
  ariaLabel,
  gap = 0.28,
}: MiniBarProps) {
  const finite = useMemo(
    () => values.map((value) => (typeof value === "number" && Number.isFinite(value) ? value : null)),
    [values],
  );
  const max = useMemo(() => Math.max(0, ...finite.map((value) => value ?? 0)), [finite]);
  const min = useMemo(() => Math.min(0, ...finite.map((value) => value ?? 0)), [finite]);
  const span = max - min || 1;
  const count = Math.max(1, finite.length);
  const barWidth = 100 / count;

  const resolvedTone: SparkTone = useMemo(() => {
    if (!autoTone) return tone;
    const first = finite.findIndex((value) => value !== null);
    const lastIndex = [...finite].reverse().findIndex((value) => value !== null);
    const firstValue = first >= 0 ? (finite[first] ?? null) : null;
    const lastValue = lastIndex >= 0 ? (finite[finite.length - 1 - lastIndex] ?? null) : null;
    if (firstValue === null || lastValue === null) return "neutral";
    if (lastValue > firstValue) return "positive";
    if (lastValue < firstValue) return "negative";
    return "neutral";
  }, [autoTone, finite, tone]);

  if (finite.every((value) => value === null)) {
    return <div className={cn("w-full rounded-sm bg-surface-sunken", className)} style={{ height }} aria-hidden="true" />;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {finite.map((value, index) => {
        if (value === null) return null;
        const ratio = clamp((value - min) / span, 0, 1);
        const top = (1 - ratio) * 100;
        const baseline = (1 - clamp((0 - min) / span, 0, 1)) * 100;
        const y = Math.min(top, baseline);
        const h = Math.max(1.5, Math.abs(baseline - top));
        return (
          <rect
            key={index}
            x={index * barWidth + (barWidth * gap) / 2}
            y={y}
            width={barWidth * (1 - gap)}
            height={h}
            rx={1.2}
            fill={TONE_VAR[resolvedTone]}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}
