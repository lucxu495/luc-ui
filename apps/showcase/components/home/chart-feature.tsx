"use client";

/*
 * The homepage's charting section.
 *
 * Two jobs: show a real chart, and state the library's actual contract about
 * data — which is the more unusual of the two. LUC UI never computes an
 * indicator, never infers a unit and never connects a gap it was not told to
 * connect; the caller prepares rows and declares formats.
 *
 * The chart itself is loaded lazily (`ssr: false` through `next/dynamic`, with a
 * skeleton at the final height so nothing shifts), because a chart engine is not
 * something a front door should block on.
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { Heading, Text } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

const CatalogChart = dynamic(() => import("./chart-canvas").then((module) => module.CatalogChart), {
  ssr: false,
  loading: () => (
    <div aria-hidden="true" className="h-[20rem] animate-pulse rounded-lg bg-surface-sunken" />
  ),
});

export function HomeChartFeature() {
  const { tcs, href } = useI18n();

  return (
    <section
      data-testid="home-charts"
      className="grid gap-8 border-t border-line-subtle pt-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12"
    >
      <div className="flex flex-col gap-3">
        <Heading size="heading" as="h2">
          {tcs("The charts state their units")}
        </Heading>
        <Text variant="caption" tone="muted" className="text-pretty">
          {tcs(
            "A chart here draws what you prepared and says nothing you did not declare: no computed indicator, no guessed currency, no line across a gap. Axes, ticks and tooltips are formatted from the format you pass in.",
          )}
        </Text>
        <Text variant="caption" tone="muted" className="text-pretty">
          {tcs(
            "The figure beside this text is the catalog itself, counted by area of the site. It is the only dataset the front door owns, so it cannot drift from what it describes.",
          )}
        </Text>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={href("/charts/catalog")}
            className="rounded-sm text-caption text-fg-accent underline luc-focus"
          >
            {tcs("Open the chart catalog")}
          </Link>
          <Link
            href={href("/charts")}
            className="rounded-sm text-caption text-fg-accent underline luc-focus"
          >
            {tcs("Chart topics")}
          </Link>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-line-subtle bg-surface-default p-3">
        <CatalogChart />
      </div>
    </section>
  );
}
