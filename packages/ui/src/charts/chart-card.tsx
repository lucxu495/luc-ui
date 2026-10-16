"use client";

import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Card, CardFooter } from "../components/card";
import { Skeleton } from "../components/skeleton";
import { Button } from "../components/button";
import { SegmentedControl, SegmentedItem } from "../components/segmented-control";
import { Tooltip } from "../components/tooltip";
import { normalizeScaleCapability, type YScaleMode } from "./core/axis";
import { ChartSyncGroupProvider } from "./core/sync-context";

// LUC chart chrome.
//
// The engine (ECharts, Lightweight Charts, visx) draws inside <ChartPlot/>.
// Everything the user actually reads and clicks — title, toolbar, legend,
// ranges, states — is engine-independent and lives here, so the visual language
// never gets dictated by whichever library renders the pixels.

export interface ChartCardProps extends React.ComponentPropsWithRef<"div"> {
  /** Height of the plot area. Charts need a bounded box, always. */
  height?: number | string;
}

export function ChartCard({ className, height = 320, children, ...props }: ChartCardProps) {
  return (
    <Card
      data-slot="chart-card"
      variant="raised"
      className={cn("min-w-0", className)}
      style={{ ["--chart-height" as string]: typeof height === "number" ? `${height}px` : height }}
      {...props}
    >
      {children}
    </Card>
  );
}

export interface ChartHeaderProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Segmented range control, timeframe, or custom actions. */
  toolbar?: ReactNode;
  /** Right-aligned readout slot, e.g. current value + delta. */
  readout?: ReactNode;
}

export function ChartHeader({ className, title, description, toolbar, readout, ...props }: ChartHeaderProps) {
  return (
    <div
      data-slot="chart-header"
      className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line-subtle px-4 py-3", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-title text-fg-primary">{title}</h3>
        {description ? <p className="text-caption text-fg-muted">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {readout}
        {toolbar}
      </div>
    </div>
  );
}

export function ChartPlot({ className, children, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="chart-plot"
      className={cn("relative w-full", className)}
      style={{ height: "var(--chart-height)" }}
      {...props}
    >
      {children}
    </div>
  );
}

export interface RangeSelectorProps {
  ranges: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function RangeSelector({ ranges, value, onValueChange, className }: RangeSelectorProps) {
  return (
    <SegmentedControl value={value} onValueChange={(next) => next && onValueChange(next)} className={className}>
      {ranges.map((range) => (
        <SegmentedItem key={range} value={range} className="px-2 uppercase">
          {range}
        </SegmentedItem>
      ))}
    </SegmentedControl>
  );
}

export interface ScaleSelectorProps {
  /**
   * Which scale modes this chart may offer. A chart that can only be linear
   * renders **nothing** — a one-option control is noise, not a setting.
   */
  allowed?: readonly YScaleMode[];
  /** The mode currently drawn. */
  value: YScaleMode;
  onValueChange: (value: YScaleMode) => void;
  labels?: Partial<Record<YScaleMode, string>>;
  className?: string;
}

/**
 * The Linear / Log control.
 *
 * A chart's scale is a *presentation* choice: switching it re-maps the same
 * values and never reloads, re-queries or mutates them. It is a segmented
 * toggle group, so it carries radio semantics (`aria-pressed` per item) and is
 * fully keyboard operable; the selected mode is never communicated by colour
 * alone. The copy comes from the caller so a localized page stays localized.
 */
export function ScaleSelector({
  allowed,
  value,
  onValueChange,
  labels,
  className,
}: ScaleSelectorProps) {
  const capability = normalizeScaleCapability({ allowed, default: value });
  if (capability.allowedScaleModes.length < 2) return null;
  const copy: Record<YScaleMode, string> = {
    linear: labels?.linear ?? "Linear",
    log: labels?.log ?? "Log",
  };
  return (
    <SegmentedControl
      data-slot="chart-scale"
      data-scale={value}
      aria-label={copy.linear + " / " + copy.log}
      value={value}
      onValueChange={(next) => {
        if (next === "linear" || next === "log") onValueChange(next);
      }}
      className={cn("text-micro", className)}
    >
      {capability.allowedScaleModes.map((mode) => (
        <SegmentedItem key={mode} value={mode} className="px-2">
          {copy[mode]}
        </SegmentedItem>
      ))}
    </SegmentedControl>
  );
}

export interface SeriesToggleProps {
  /**
   * The series the control can show or hide.
   *
   * `tone` resolves through the semantic tone vocabulary. A caller that already
   * holds the *exact* colour its engine drew - a palette slot, a categorical
   * identity — passes it as `color` instead, so the swatch is the mark's own
   * colour rather than a near-match.
   *
   * A caller that also knows *how* the series is drawn (`mark`, `line`,
   * `weight`, `muted`) gets a sample of that encoding instead of a flat chip: a
   * bar is not shown as a line, and a dashed threshold is not shown as a solid
   * series. The legend is the plot's decoding key, so it reproduces the plot.
   */
  series: readonly ChartLegendItem[];
  visible: readonly string[];
  onToggle: (id: string) => void;
  className?: string;
}

/** One entry of a chart legend: the series and the encoding it was drawn with. */
export interface ChartLegendItem {
  id: string;
  label: string;
  tone?: string;
  color?: string;
  /** The mark kind the engine drew. */
  mark?: "line" | "area" | "bar";
  /** The dash treatment the engine drew. */
  line?: "solid" | "dashed" | "dotted";
  /** Relative stroke weight (the series being read reads heavier). */
  weight?: "thin" | "regular" | "strong";
  /** A faint context series is drawn - and shown - more quietly. */
  muted?: boolean;
  /** Extra attributes on the control element (QA/diagnostic hooks). */
  attributes?: Record<string, string>;
}

const LEGEND_DASH: Record<"solid" | "dashed" | "dotted", string | undefined> = {
  solid: undefined,
  dashed: "5 4",
  dotted: "1 3",
};

const LEGEND_STROKE: Record<"thin" | "regular" | "strong", number> = {
  thin: 1.5,
  regular: 2.25,
  strong: 3,
};

/**
 * The legend's sample of one series: the plot's own encoding, at legend size.
 *
 * A chart whose bars, areas and dashed reference lines are all drawn as a small
 * coloured square asks the reader to remember what each series looked like. The
 * sample is thick enough to read (22×12) and carries the mark, the dash and the
 * relative weight, so the legend can be mapped back to the plot at a glance.
 */
function SeriesSample({
  color,
  mark = "line",
  line = "solid",
  weight = "regular",
  muted = false,
}: {
  color: string;
  mark?: "line" | "area" | "bar";
  line?: "solid" | "dashed" | "dotted";
  weight?: "thin" | "regular" | "strong";
  muted?: boolean;
}) {
  if (mark === "bar") {
    return (
      <svg aria-hidden="true" width="22" height="12" viewBox="0 0 22 12" className="shrink-0">
        <rect x="7" y="1.5" width="8" height="9" rx="1.5" fill={color} opacity={muted ? 0.5 : 1} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width="22" height="12" viewBox="0 0 22 12" className="shrink-0">
      {mark === "area" ? <path d="M1 9.5 L11 3 L21 9.5 Z" fill={color} opacity={muted ? 0.16 : 0.26} /> : null}
      <line
        x1="1"
        y1="6"
        x2="21"
        y2="6"
        stroke={color}
        strokeWidth={LEGEND_STROKE[weight]}
        strokeDasharray={LEGEND_DASH[line]}
        strokeLinecap="round"
        opacity={muted ? 0.6 : 1}
      />
    </svg>
  );
}

/** Legend doubles as the series visibility control. One control, two jobs. */
export function ChartLegend({ series, visible, onToggle, className }: SeriesToggleProps) {
  return (
    <ul data-slot="chart-legend" className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {series.map((item) => {
        const isVisible = visible.includes(item.id);
        const color = item.color ?? toneToColor(item.tone);
        const encoded =
          item.mark !== undefined ||
          item.line !== undefined ||
          item.weight !== undefined ||
          item.muted !== undefined;
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={isVisible}
              onClick={() => onToggle(item.id)}
              /*
               * QA/diagnostic hooks live on the control itself: a caller that
               * moved a real switch into the legend (the price context) keeps
               * the same `data-slot` its tests and AT copy already use.
               */
              {...item.attributes}
              className={cn(
                "luc-transition luc-focus inline-flex items-center gap-2 rounded-xs px-1 py-0.5",
                "text-caption",
                isVisible ? "text-fg-secondary hover:text-fg-primary" : "text-fg-muted opacity-60 line-through",
              )}
            >
              {encoded ? (
                <span className="inline-flex">
                  <SeriesSample
                    color={color}
                    mark={item.mark}
                    line={item.line}
                    weight={item.weight}
                    muted={item.muted}
                  />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2.5 w-2.5 rounded-[3px] border",
                    isVisible ? "border-transparent" : "border-line-strong bg-transparent",
                  )}
                  style={isVisible ? { backgroundColor: color } : undefined}
                />
              )}
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function toneToColor(tone?: string): string {
  switch (tone) {
    case "positive":
      return "var(--positive)";
    case "negative":
      return "var(--negative)";
    case "warning":
      return "var(--warning)";
    case "info":
      return "var(--info)";
    case "neutral":
      return "var(--fg-muted)";
    default:
      return "var(--accent-default)";
  }
}

export function ChartToolbar({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div data-slot="chart-toolbar" className={cn("flex items-center gap-1.5", className)} {...props} />;
}

export interface ChartTooltipSurfaceProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  title?: ReactNode;
}

/** Positioned by the engine; styled by LUC. Pass it down as the tooltip node. */
export function ChartTooltipSurface({ className, title, children, ...props }: ChartTooltipSurfaceProps) {
  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        "pointer-events-none min-w-40 rounded-md border border-chart-tooltip-border bg-chart-tooltip-surface p-2.5 shadow-overlay",
        className,
      )}
      {...props}
    >
      {title ? <p className="mb-1.5 text-micro text-fg-muted uppercase">{title}</p> : null}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

export function ChartTooltipRow({
  label,
  value,
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 text-caption", className)}>
      <span className="flex items-center gap-1.5 text-fg-muted">
        <span
          aria-hidden="true"
          className="size-2 rounded-[2px]"
          style={{ backgroundColor: toneToColor(tone) }}
        />
        {label}
      </span>
      <span className="luc-numeric font-medium text-fg-primary">{value}</span>
    </div>
  );
}

export interface FullscreenButtonProps {
  onClick: () => void;
  className?: string;
  /**
   * Accessible name for the button. The library's default is English; a
   * product that ships another language passes its own string rather than
   * patching a translated copy of the component.
   */
  label?: string;
  /** Tooltip text. Defaults to the accessible name's short form. */
  tooltip?: string;
}

export function FullscreenButton({
  onClick,
  className,
  label = "Toggle fullscreen",
  tooltip = "Fullscreen",
}: FullscreenButtonProps) {
  return (
    <Tooltip content={tooltip} side="bottom">
      <Button
        size="sm"
        variant="ghost"
        onClick={onClick}
        className={className}
        leadingIcon={
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
            <path
              d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
      >
        <span className="sr-only">{label}</span>
      </Button>
    </Tooltip>
  );
}

export function ChartSkeleton({ height = 320, className }: { height?: number | string; className?: string }) {
  return (
    <div
      data-slot="chart-skeleton"
      className={cn("flex flex-col gap-3 p-4", className)}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading chart</span>
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-40" />
      </div>
      <Skeleton className="min-h-0 flex-1" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export interface ChartStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "negative";
  className?: string;
  /**
   * Size the state to its own content instead of filling the plot rectangle.
   *
   * A chart that *has nothing to draw* must not reserve the space it would have
   * used to draw something: a 400-pixel plot holding one "No data" line is
   * whitespace, not information. Callers that own a fixed surface (a card body
   * that must keep its height) leave this off.
   */
  compact?: boolean;
}

function ChartState({
  title,
  description,
  action,
  icon,
  tone = "neutral",
  className,
  compact = false,
}: ChartStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center",
        compact && "flex-none py-8",
        className,
      )}
      style={compact ? undefined : { height: "100%" }}
    >
      {icon ? (
        <span
          className={cn(
            "grid size-10 place-items-center rounded-lg border border-line-subtle bg-surface-interactive",
            tone === "negative" ? "text-fg-negative" : "text-fg-disabled",
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-label font-medium text-fg-secondary">{title}</p>
        {description ? <p className="max-w-72 text-caption text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ChartEmptyState(props: Omit<ChartStateProps, "tone">) {
  return (
    <ChartState
      {...props}
      icon={
        props.icon ?? (
          <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
            <path
              d="M3 16.5V6.2M7.5 16.5V9.4M12 16.5v-4.6M16.5 16.5V4.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
        )
      }
    />
  );
}

export function ChartErrorState(props: Omit<ChartStateProps, "tone">) {
  return (
    <ChartState
      {...props}
      tone="negative"
      icon={
        props.icon ?? (
          <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
            <path
              d="M10 2.8 18.4 17H1.6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M10 7.6v3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="14" r="0.9" fill="currentColor" />
          </svg>
        )
      }
    />
  );
}

export interface SyncGroupProps {
  /** Charts in the same group share crosshair and visible range. */
  groupId: string;
  children: ReactNode;
  className?: string;
}

/**
 * Declares a sync group and makes its id inherit to the charts inside.
 *
 * The live crosshair/range state lives in the sync bus (`core/sync.ts`), not
 * here — this component only scopes the group id, so a chart inside it that does
 * not name its own `syncGroup` joins the surrounding group automatically.
 */
export function ChartSyncGroup({ groupId, children, className }: SyncGroupProps) {
  return (
    <ChartSyncGroupProvider groupId={groupId}>
      <div data-slot="chart-sync-group" data-sync-group={groupId} className={cn("flex flex-col gap-3", className)}>
        {children}
      </div>
    </ChartSyncGroupProvider>
  );
}

/** Small helper for local UI state in chart toolbars. */
export function useRangeState(defaultRange: string) {
  const [range, setRange] = useState(defaultRange);
  return [range, setRange] as const;
}

export { CardFooter as ChartFooter };
