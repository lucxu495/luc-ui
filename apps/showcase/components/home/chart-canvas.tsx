"use client";

/*
 * The homepage's chart, in its own module so it can be loaded lazily.
 *
 * Importing a chart from `@luc/ui/charts` pulls the chart engine with it. That is
 * the right price for a chart page and the wrong price for the front door, so the
 * page loads this through `next/dynamic` after hydration and reserves the height
 * in the meantime.
 *
 * The series is the catalog's own composition — how many entries belong to each
 * area — read from the generated discovery projection. Nothing is invented: the
 * chart is a view of data the site already ships, which is the only kind of
 * demonstration that cannot drift from what it claims.
 */

import { BarChart } from "@luc/ui/charts";
import { areaById } from "@/lib/discovery/areas";
import { discoveryStats } from "@/lib/discovery/catalog";
import { useI18n } from "@/lib/i18n/provider";

export function CatalogChart() {
  const { tcs, tn } = useI18n();

  const rows = Object.entries(discoveryStats.byArea)
    .map(([area, count]) => ({
      area: tn(areaById.get(area)?.label ?? area),
      entries: count,
    }))
    .sort((a, b) => b.entries - a.entries);

  return (
    <BarChart
      data={rows}
      xKey="area"
      axes={[{ id: "primary", format: { kind: "number", decimals: 0 } }]}
      series={[
        {
          key: "entries",
          label: tcs("catalog entries"),
          type: "bar",
          tone: "accent",
          axis: "primary",
        },
      ]}
      height={320}
      ariaLabel={tcs("Catalog entries per area of the site")}
    />
  );
}
