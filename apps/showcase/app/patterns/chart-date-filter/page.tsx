"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Badge,
  CalendarDate,
  DateRangePicker,
  Field,
  SegmentedControl,
  SegmentedItem,
  Section,
  Text,
  formatDateRange,
  type DateRange,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { DEMO_TODAY, RANGE_PRESETS } from "@/lib/form-data";
import { marketSeries } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const SERIES = marketSeries({ days: 520 });

const asCalendarDate = (time: Date) =>
  new CalendarDate(time.getUTCFullYear(), time.getUTCMonth() + 1, time.getUTCDate());

/**
 * A chart whose window is chosen with a date range.
 *
 * The picker returns two calendar dates; the page decides which prepared rows
 * fall inside them. Nothing refetches, nothing recomputes an indicator, and the
 * chart is given exactly the rows it should draw.
 */
export default function ChartDateFilterPatternPage() {
  const { tcs } = useI18n();
  const [range, setRange] = useState<DateRange | null>({
    start: new CalendarDate(2026, 1, 1),
    end: asCalendarDate(SERIES[SERIES.length - 1]!.time),
  });
  const [view, setView] = useState<"price" | "volatility">("price");

  const rows = useMemo(() => {
    if (!range) return SERIES;
    return SERIES.filter((row) => {
      const day = asCalendarDate(row.time);
      return day.compare(range.start) >= 0 && day.compare(range.end) <= 0;
    });
  }, [range]);

  const days = rows.length;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Chart and dates")}
        title="Chart with a date range"
        lead="A research window over a prepared series. The range picker is the only control that changes what is drawn, and the data layer stays the caller's: LUC renders rows, it does not fetch them."
      />

      <Section
        title={tcs("Window first, chart second")}
        description={tcs("Presets cover the common windows; the calendar covers everything else. Both write the same two calendar dates.")}
      >
        <Demo bare>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 rounded-lg border border-line-subtle bg-surface-canvas p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <Field
                label={tcs("Window")}
                description={
                  range
                    ? `${formatDateRange(range, { locale: "en-US" })} · ${days} prepared rows`
                    : `Full history · ${days} prepared rows`
                }
              >
                <DateRangePicker
                  value={range}
                  onValueChange={setRange}
                  presets={RANGE_PRESETS}
                  todayValue={DEMO_TODAY}
                  months={2}
                  locale="en-US"
                />
              </Field>
              <div className="flex items-center gap-3 pb-0.5">
                <SegmentedControl value={view} onValueChange={(next) => next && setView(next as "price" | "volatility")}>
                  <SegmentedItem value="price">Price</SegmentedItem>
                  <SegmentedItem value="volatility">Volatility</SegmentedItem>
                </SegmentedControl>
                <Badge tone="neutral">{days} points</Badge>
              </div>
            </div>

            <div className="rounded-lg border border-line-subtle bg-surface-canvas p-4">
              {rows.length > 0 ? (
                <AreaChart
                  data={rows}
                  xKey="time"
                  height={360}
                  ariaLabel={view === "price" ? "Close price" : "Realised volatility"}
                  axes={
                    view === "price"
                      ? [{ id: "primary", label: "Close", format: { kind: "currency", currency: "USD" } }]
                      : [{ id: "primary", label: "RV", format: { kind: "percent", decimals: 1 } }]
                  }
                  series={
                    view === "price"
                      ? [{ key: "close", label: "Close", type: "area", tone: "accent" }]
                      : [
                          { key: "rv30", label: "RV 30d", type: "area", tone: "warning" },
                          { key: "rv90", label: "RV 90d", type: "line", tone: "info" },
                        ]
                  }
                />
              ) : (
                <Text variant="body" tone="muted" className="py-16 text-center">
                  {tcs("No prepared rows fall inside this window.")}</Text>
              )}
            </div>
          </div>
        </Demo>
      </Section>

      <Section
        title={tcs("What the chart is given")}
        description={tcs("Prepared rows in, prepared rows drawn. Luc UI never thins, resamples or derives a series — if a window is too dense to draw honestly, the data layer decides what to send.")}
      >
        <Text variant="body" tone="secondary" className="max-w-[70ch]">
          {tcs("That is also why a date filter here is cheap: changing the window does not change any financial semantics, it only changes which of the caller's rows are passed to the engine.")}</Text>
      </Section>
    </DocPage>
  );
}
