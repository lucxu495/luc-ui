"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Code,
  LineChart,
  PieChart,
  Section,
  Switch,
  Text,
  type ChartFormat,
} from "@luc/ui";
import { ChartPanel } from "@/components/charts/chart-panel";
import { useI18n } from "@/lib/i18n/provider";

const DAY = 86_400_000;
const START = Date.UTC(2025, 0, 2);

/**
 * Deterministic synthetic observations for interaction review.
 *
 * These values are deliberately shaped, not sampled from a provider. The
 * screenshot and the labels are reproducible, and the page states plainly that
 * this is Demo Data rather than current Bitcoin market data.
 */
export const FINANCIAL_CROSSHAIR_DEMO_DATA = Array.from({ length: 240 }, (_, index) => {
  const trend = 66_000 + index * 94;
  const wave = Math.sin(index / 8.2) * 4_900 + Math.sin(index / 23) * 2_100;
  const price = Math.round(trend + wave);
  return {
    time: START + index * DAY,
    price,
    trend: Math.round(65_500 + index * 92 + Math.sin(index / 18) * 1_250),
    fast: Math.round(price + Math.sin(index / 5.5) * 720),
    ratio: Number((49 + Math.sin(index / 11) * 8.5 + Math.cos(index / 31) * 4.2).toFixed(1)),
  };
});

const CURRENCY: ChartFormat = { kind: "currency", currency: "USD", decimals: 0 };
const PERCENT: ChartFormat = { kind: "percent", decimals: 1 };

const PORTFOLIO = [
  { name: "Equity", value: 42 },
  { name: "Credit", value: 24 },
  { name: "Rates", value: 16 },
  { name: "Gold", value: 11 },
  { name: "Cash", value: 7 },
];

export function FinancialCrosshairDemo() {
  const { tcs } = useI18n();
  const [crosshair, setCrosshair] = useState(true);
  const [snap, setSnap] = useState(true);
  const interaction = useMemo(
    () => ({
      zoom: "inside" as const,
      pan: true,
      axisDrag: true,
      crosshair: { enabled: crosshair, snap },
    }),
    [crosshair, snap],
  );

  return (
    <>
      <Section
        title={tcs("Professional financial crosshair")}
        description={tcs(
          "Hover the plot for a persistent X/Y crosshair. Drag the time plate horizontally, or either Y plate vertically, to scale. Double-click an axis to reset its own scale.",
        )}
      >
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line-subtle bg-surface-sunken px-4 py-3">
          <Switch
            id="crosshair-enabled"
            checked={crosshair}
            onCheckedChange={setCrosshair}
            label={tcs("Crosshair enabled")}
          />
          <Switch
            id="crosshair-snap"
            checked={snap}
            onCheckedChange={setSnap}
            disabled={!crosshair}
            label={tcs("Snap X to observation")}
          />
          <Badge size="sm" tone="neutral" dot>
            {tcs("Demo Data")}
          </Badge>
          <Text variant="caption" tone="muted" as="p">
            {tcs("Drag axis to scale · Double-click to reset")}
          </Text>
        </div>

        <div className="flex flex-col gap-5">
          <div data-qa="crosshair-single">
            <ChartPanel
              title={tcs("Demo A · Single-axis time series")}
              description={tcs(
                "Synthetic daily close with a currency Y axis. The horizontal label follows the pointer pixel, not a series point.",
              )}
              height={320}
              render={({ height }) => (
                <LineChart
                  data={FINANCIAL_CROSSHAIR_DEMO_DATA}
                  xKey="time"
                  x={{ type: "time" }}
                  axes={[{ id: "price", position: "left", format: CURRENCY }]}
                  series={[
                    {
                      key: "price",
                      label: "Synthetic close",
                      tone: "accent",
                      axis: "price",
                      symbol: false,
                      lineWidth: 1.8,
                    },
                  ]}
                  interaction={{ zoom: "inside", pan: true, axisDrag: true }}
                  height={height}
                  ariaLabel={tcs("Synthetic single-axis financial crosshair demo")}
                />
              )}
            />
          </div>

          <div data-qa="crosshair-dual">
            <ChartPanel
              title={tcs("Demo B · BTC USD price + rolling up-day ratio")}
              description={tcs(
                "Left axis: synthetic rolling 1Y up-day ratio (%). Right axis: synthetic BTC USD price. Each plate keeps its own scale, formatter and drag gesture.",
              )}
              height={380}
              render={({ height }) => (
                <LineChart
                  data={FINANCIAL_CROSSHAIR_DEMO_DATA}
                  xKey="time"
                  x={{ type: "time" }}
                  axes={[
                    {
                      id: "ratio",
                      label: "Rolling 1Y up-day ratio",
                      position: "left",
                      format: PERCENT,
                      min: 20,
                      max: 80,
                    },
                    {
                      id: "price",
                      label: "BTC USD price",
                      position: "right",
                      format: CURRENCY,
                    },
                  ]}
                  series={[
                    {
                      key: "ratio",
                      label: "Rolling 1Y up-day ratio",
                      tone: "warning",
                      axis: "ratio",
                      symbol: false,
                      lineWidth: 1.5,
                    },
                    {
                      key: "price",
                      label: "Synthetic BTC USD",
                      tone: "accent",
                      axis: "price",
                      symbol: false,
                      lineWidth: 1.9,
                    },
                  ]}
                  tooltip={{ mode: "axis", sort: "none" }}
                  interaction={interaction}
                  height={height}
                  ariaLabel={tcs("Synthetic dual-axis Bitcoin price and up-day ratio demo")}
                />
              )}
            />
          </div>

          <div data-qa="crosshair-multi">
            <ChartPanel
              title={tcs("Demo C · Multi-series, zoom and pan")}
              description={tcs(
                "Two prepared price curves share one time window. Wheel zoom, plot pan and direct axis drag use the same DataZoom state.",
              )}
              height={340}
              ranges={["3m", "6m", "all"]}
              defaultRange="all"
              render={({ range, height }) => {
                const days = range === "3m" ? 91 : range === "6m" ? 182 : FINANCIAL_CROSSHAIR_DEMO_DATA.length;
                return (
                  <LineChart
                    data={FINANCIAL_CROSSHAIR_DEMO_DATA.slice(-days)}
                    xKey="time"
                    x={{ type: "time" }}
                    axes={[{ id: "price", position: "right", format: CURRENCY }]}
                    series={[
                      { key: "price", label: "Synthetic close", tone: "accent", symbol: false },
                      { key: "fast", label: "Prepared fast line", tone: "info", symbol: false },
                      { key: "trend", label: "Prepared trend", tone: "neutral", symbol: false, lineType: "dashed" },
                    ]}
                    interaction={{ zoom: "slider", pan: true, axisDrag: true, brush: true }}
                    height={height}
                    ariaLabel={tcs("Synthetic multi-series crosshair and zoom demo")}
                  />
                );
              }}
            />
          </div>
        </div>
      </Section>

      <Section
        title={tcs("Demo D · Non-Cartesian stays unchanged")}
        description={tcs(
          "A pie has no Cartesian time or value plates. It keeps item hover and receives no crosshair configuration or axis-drag listener.",
        )}
      >
        <div data-qa="crosshair-non-cartesian" className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Portfolio weights · Demo Data")}
            description={tcs("Five deterministic weights; hover reports one item.")}
            height={320}
            render={({ height }) => (
              <PieChart
                data={PORTFOLIO}
                centerValue="100"
                centerLabel={tcs("Weight")}
                format={PERCENT}
                height={height}
                ariaLabel={tcs("Synthetic portfolio weight pie chart")}
              />
            )}
          />
          <div className="rounded-xl border border-line-subtle bg-surface-sunken p-5">
            <Text variant="label" as="p">
              {tcs("Why no crosshair here?")}
            </Text>
            <Text variant="body" tone="secondary" as="p" className="mt-2 max-w-[48ch]">
              {tcs(
                "Crosshair is a Cartesian reading aid. A pie encodes part-to-whole by angle and area, so a horizontal dollar coordinate would be invented rather than measured.",
              )}
            </Text>
          </div>
        </div>
      </Section>

      <Section title={tcs("Configuration")}>
        <Code block>{`<LineChart
  data={preparedRows}
  xKey="time"
  axes={[
    { id: "ratio", position: "left", format: { kind: "percent", decimals: 1 } },
    { id: "price", position: "right", format: { kind: "currency", currency: "USD", decimals: 0 } },
  ]}
  series={[
    { key: "ratio", axis: "ratio" },
    { key: "price", axis: "price" },
  ]}
  interaction={{
    crosshair: { enabled: true, snap: true },
    axisDrag: true,
    zoom: "inside",
    pan: true,
  }}
/>`}</Code>
      </Section>
    </>
  );
}
