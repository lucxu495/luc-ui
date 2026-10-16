"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  ChartCard,
  ChartEmptyState,
  ChartErrorState,
  ChartHeader,
  ChartLegend,
  ChartPlot,
  ChartSkeleton,
  ChartToolbar,
  FullscreenButton,
  FullscreenResearchView,
  RangeSelector,
  ScaleSelector,
  SegmentedControl,
  SegmentedItem,
  cn,
  type ChartState,
  type SeriesTone,
  type YScaleMode,
} from "@luc/ui";
import { useOptionalI18n } from "@/lib/i18n/provider";

export interface DemoSeries {
  id: string;
  label: string;
  tone?: SeriesTone;
}

export interface ChartPanelContext {
  range: string;
  visibleSeries: readonly string[] | undefined;
  state: ChartState;
  height: number | string;
  fullscreen: boolean;
  /** The selected axis scale — the same value inline and in fullscreen. */
  scaleMode: YScaleMode;
}

export interface ChartPanelProps {
  title: ReactNode;
  description?: ReactNode;
  readout?: ReactNode;
  series?: readonly DemoSeries[];
  defaultVisible?: readonly string[];
  ranges?: readonly string[];
  defaultRange?: string;
  /**
   * Offer the Linear/Log control. The mode is owned here, so the fullscreen view
   * and the inline chart always show the same axis.
   */
  scale?: {
    allowed: readonly YScaleMode[];
    default?: YScaleMode;
  };
  height?: number;
  /** Extra header controls, rendered before the range selector. */
  actions?: ReactNode;
  /** Show the ready/loading/empty/error simulator in the footer. */
  states?: boolean;
  exportTarget?: () => unknown;
  exportFilename?: string;
  footer?: ReactNode;
  className?: string;
  render: (context: ChartPanelContext) => ReactNode;
}

/**
 * The Showcase chart frame: card, header with readout and toolbar, bounded plot
 * with real state handling, a legend that doubles as the series control, and an
 * optional state simulator so the loading, empty and error paths are reviewable
 * next to the real chart.
 */
export function ChartPanel({
  title,
  description,
  readout,
  series,
  defaultVisible,
  ranges,
  defaultRange,
  scale,
  height = 320,
  actions,
  states = false,
  exportTarget,
  exportFilename,
  footer,
  className,
  render,
}: ChartPanelProps) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  const [range, setRange] = useState(defaultRange ?? ranges?.[ranges.length - 1] ?? "all");
  const [scaleMode, setScaleMode] = useState<YScaleMode>(scale?.default ?? "linear");
  const [chartState, setChartState] = useState<ChartState>("ready");
  const [fullscreen, setFullscreen] = useState(false);
  const [visible, setVisible] = useState<string[]>(
    () => [...(defaultVisible ?? series?.map((item) => item.id) ?? [])],
  );

  const visibleSeries = series ? visible : undefined;

  const legend = series ? (
    <ChartLegend
      series={series}
      visible={visible}
      onToggle={(id) =>
        setVisible((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        )
      }
    />
  ) : null;

  return (
    <>
      <ChartCard height={height} className={className}>
        <ChartHeader
          title={title}
          description={description}
          readout={readout}
          toolbar={
            <ChartToolbar>
              {actions}
              {scale && scale.allowed.length > 1 ? (
                <ScaleSelector allowed={scale.allowed} value={scaleMode} onValueChange={setScaleMode} />
              ) : null}
              {ranges ? <RangeSelector ranges={ranges} value={range} onValueChange={setRange} /> : null}
              <FullscreenButton
                onClick={() => setFullscreen(true)}
                label={tcs("Toggle fullscreen")}
                tooltip={tcs("Fullscreen")}
              />
            </ChartToolbar>
          }
        />
        <ChartPlot className="px-1.5 pt-2 pb-1">
          {chartState === "loading" ? (
            <ChartSkeleton height="100%" />
          ) : chartState === "empty" ? (
            <ChartEmptyState
              title={tcs("No series selected")}
              description={tcs("Enable at least one series to render this chart.")}
              action={
                <Button size="sm" variant="secondary" onClick={() => setChartState("ready")}>
                  {tcs("Show series")}
                </Button>
              }
            />
          ) : chartState === "error" ? (
            <ChartErrorState
              title={tcs("Series unavailable")}
              description={tcs("The provider returned no rows for this window.")}
              action={
                <Button size="sm" variant="secondary" onClick={() => setChartState("ready")}>
                  {tcs("Retry")}
                </Button>
              }
            />
          ) : (
            <div className="h-full min-h-0 w-full">
              {render({
                range,
                visibleSeries,
                state: chartState,
                height: "100%",
                fullscreen: false,
                scaleMode,
              })}
            </div>
          )}
        </ChartPlot>
        {legend || states || footer ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
              {legend}
              {footer}
            </div>
            {states ? (
              <SegmentedControl
                size="sm"
                value={chartState}
                onValueChange={(next) => next && setChartState(next as ChartState)}
              >
                {(["ready", "loading", "empty", "error"] as const).map((option) => (
                  <SegmentedItem size="sm" key={option} value={option}>
                    {option}
                  </SegmentedItem>
                ))}
              </SegmentedControl>
            ) : null}
          </div>
        ) : null}
      </ChartCard>

      {fullscreen ? (
        <FullscreenResearchView
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={title}
          description={description}
          metrics={readout}
          ranges={ranges}
          range={range}
          onRangeChange={setRange}
          scale={
            scale && scale.allowed.length > 1
              ? { allowed: scale.allowed, value: scaleMode, onValueChange: setScaleMode }
              : undefined
          }
          exportTarget={exportTarget}
          exportFilename={exportFilename}
          legend={legend}
          renderChart={({ height: boxHeight }) =>
            render({ range, visibleSeries, state: "ready", height: boxHeight, fullscreen: true, scaleMode })
          }
        />
      ) : null}
    </>
  );
}

/** Small caption naming the chart family or engine under a demo. */
export function ChartMeta({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-caption text-fg-muted", className)}>{children}</p>;
}
