"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  CandlestickChart,
  Card,
  CardContent,
  DataTable,
  DrawdownChart,
  FactorExposureChart,
  SegmentedControl,
  SegmentedItem,
  formatNumber,
  percentColumn,
  textColumn,
  type DataTableColumn,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import { candles, candleOverlays, drawdownPoints, factorExposures } from "@/lib/chart-packs-data";

// Desk — quantitative analytics.
//
// A desk surface has one job: let a reader move between a range and a row
// without losing their place. The range control narrows the *view*, the table
// selection drives the figures beside it, and both engines draw the same
// supplied series — nothing on this page computes an indicator.
//
// Phase 7 fixed a real defect on this chart family: the drawdown's time axis
// printed "Jan Jan Feb Feb" because the label granularity came from the span
// while the tick spacing came from the canvas width. The axis plan now derives
// both from the same span, and `axis-time.test.ts` renders every scale through
// the engine to keep it that way.

interface Position {
  id: string;
  symbol: string;
  side: "Long" | "Short";
  weight: number;
  pnl: number;
  contribution: number;
}

const POSITIONS: Position[] = [
  { id: "p1", symbol: "BTCUSD", side: "Long", weight: 0.34, pnl: 0.061, contribution: 0.021 },
  { id: "p2", symbol: "ETHUSD", side: "Long", weight: 0.22, pnl: 0.038, contribution: 0.008 },
  { id: "p3", symbol: "SOLUSD", side: "Long", weight: 0.14, pnl: -0.017, contribution: -0.002 },
  { id: "p4", symbol: "AVAXUSD", side: "Short", weight: 0.11, pnl: 0.024, contribution: 0.003 },
  { id: "p5", symbol: "LINKUSD", side: "Long", weight: 0.09, pnl: -0.032, contribution: -0.003 },
  { id: "p6", symbol: "DXY", side: "Short", weight: 0.06, pnl: 0.009, contribution: 0.001 },
];

const RANGES = [
  { id: "30", label: "30 sessions", days: 30 },
  { id: "60", label: "60 sessions", days: 60 },
  { id: "120", label: "All 120", days: 120 },
];

export function DeskTerminal() {
  const { tcs } = useI18n();
  const [rangeId, setRangeId] = useState("120");
  const [selectedId, setSelectedId] = useState<string | null>("p1");

  const days = RANGES.find((entry) => entry.id === rangeId)?.days ?? 120;
  const visibleCandles = candles.slice(-days);
  const visibleDrawdown = drawdownPoints.slice(-days);
  const selected = POSITIONS.find((position) => position.id === selectedId) ?? null;

  const columns = useMemo<Array<DataTableColumn<Position>>>(
    () => [
      textColumn<Position, "symbol">("symbol", {
        header: tcs("Instrument"),
        locked: true,
        pin: "start",
        size: 140,
        emphasis: true,
      }),
      textColumn<Position, "side">("side", { header: tcs("Side"), size: 90 }),
      percentColumn<Position, "weight">("weight", { header: tcs("Weight"), decimals: 1, size: 110 }),
      percentColumn<Position, "pnl">("pnl", { header: tcs("P&L"), decimals: 2, size: 110 }),
      percentColumn<Position, "contribution">("contribution", {
        header: tcs("Contribution"),
        decimals: 2,
        size: 130,
      }),
    ],
    [tcs],
  );

  return (
    <div data-slot="desk" className="flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-6 py-4">
        <div className="flex flex-col">
          <h2 className="font-display text-heading-sm font-semibold text-fg-primary">
            {tcs("Desk")}
          </h2>
          <p className="text-caption text-fg-muted">
            {tcs("One book, one window, and the numbers the book reported.")}
          </p>
        </div>
        <SegmentedControl
          value={rangeId}
          onValueChange={setRangeId}
          aria-label={tcs("Window")}
        >
          {RANGES.map((entry) => (
            <SegmentedItem key={entry.id} value={entry.id}>
              {tcs(entry.label)}
            </SegmentedItem>
          ))}
        </SegmentedControl>
      </header>

      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card variant="default">
            <CardContent className="p-4">
              <CandlestickChart
                title={tcs("BTCUSD, daily")}
                description={tcs("Two supplied moving averages and a volatility band")}
                ariaLabel={tcs("Daily candlestick chart of BTCUSD with two moving averages")}
                candles={visibleCandles}
                overlays={candleOverlays}
                priceFormat={{ kind: "currency", currency: "USD", decimals: 0 }}
                height={340}
              />
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card variant="default">
              <CardContent className="p-4">
                <DrawdownChart
                  title={tcs("Underwater")}
                  description={tcs("Ratio-scaled values, formatted once at the render boundary")}
                  ariaLabel={tcs("Drawdown from the running peak")}
                  points={visibleDrawdown}
                  height={240}
                />
              </CardContent>
            </Card>
            <Card variant="default">
              <CardContent className="p-4">
                <FactorExposureChart
                  title={tcs("Factor exposure")}
                  description={tcs("Signed exposures, zero-centred")}
                  ariaLabel={tcs("Bar chart of factor exposures, zero-centred")}
                  factors={factorExposures}
                  format={{ kind: "percent", decimals: 1 }}
                  height={240}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <Card variant="default">
            <CardContent className="p-4">
              <DataTable<Position>
                ariaLabel={tcs("Open positions")}
                ariaDescription={tcs(
                  "Six positions with their weight, profit and loss and contribution to the book.",
                )}
                data={POSITIONS}
                columns={columns}
                getRowId={(row) => row.id}
                density="compact"
                enableRowSelection="single"
                rowSelection={selectedId ? { [selectedId]: true } : {}}
                onRowSelectionChange={(next) =>
                  setSelectedId(Object.keys(next).find((key) => next[key]) ?? null)
                }
              />
            </CardContent>
          </Card>

          <Card variant="raised" data-slot="position-inspector">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 data-slot="position-inspector-title" className="text-label font-semibold text-fg-primary">
                  {selected ? selected.symbol : tcs("Nothing selected")}
                </h3>
                {selected ? (
                  <Badge tone={selected.side === "Long" ? "positive" : "warning"} size="sm">
                    {tcs(selected.side)}
                  </Badge>
                ) : null}
              </div>
              {selected ? (
                <dl className="flex flex-col gap-2">
                  {[
                    { id: "weight", label: tcs("Weight"), value: `${(selected.weight * 100).toFixed(1)} %` },
                    {
                      id: "pnl",
                      label: tcs("Profit and loss"),
                      value: formatNumber(selected.pnl * 100, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        suffix: " %",
                        signed: true,
                      }),
                    },
                    {
                      id: "contribution",
                      label: tcs("Contribution"),
                      value: formatNumber(selected.contribution * 100, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        suffix: " %",
                        signed: true,
                      }),
                    },
                  ].map((row) => (
                    <div key={row.id} className="flex items-baseline justify-between gap-3">
                      <dt className="text-caption text-fg-muted">{row.label}</dt>
                      <dd className="text-label text-fg-primary luc-numeric">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-caption text-fg-muted text-pretty">
                  {tcs("Choose a row to see the position's own figures beside the table.")}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
