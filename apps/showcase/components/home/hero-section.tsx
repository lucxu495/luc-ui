/*
 * The homepage hero.
 *
 * The front door of a design system has one job the rest of the site does not:
 * it has to *look* like the system it is selling. So the hero is built the way
 * the system says pages are built — hairline bands, display type at a real
 * display size, a mono meta line, and a specimen sheet of live components —
 * rather than with a gradient, a floating card and a stock photograph.
 *
 * It is a server component. The previous version was a client island with a
 * specimen switcher; that cost the front door a hydration pass to show one
 * family at a time, where the sheet below shows four at once. Nothing here is
 * interactive except the copy button and the links.
 *
 * Every number in the fact strip is read from the discovery catalog, so the front
 * door cannot claim a count the catalog does not have.
 */

import Link from "next/link";
import Image from "next/image";
import {
  Badge,
  Button,
  Delta,
  Heading,
  Inline,
  Metric,
  MetricValue,
  Progress,
  SegmentedControl,
  SegmentedItem,
  Text,
  buttonVariants,
} from "@luc/ui";
import { CopyButton } from "@/components/docs/copy-button";
import { HomeSearchAction } from "@/components/home/home-search-action";
import { discoveryStats } from "@/lib/discovery/catalog";
import { getServerCopy } from "@/lib/i18n/server";

export async function HomeHero() {
  const { tcs, href } = await getServerCopy();

  const facts = [
    { id: "entries", value: discoveryStats.total, label: tcs("catalog entries") },
    {
      id: "components",
      value: discoveryStats.byKind.component ?? 0,
      label: tcs("components and integrations"),
    },
    { id: "charts", value: discoveryStats.byKind.chart ?? 0, label: tcs("canonical charts") },
    { id: "motion", value: discoveryStats.byKind.motion ?? 0, label: tcs("motion components") },
  ];

  return (
    <section data-testid="home-hero" className="flex flex-col gap-10 pb-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end">
        <div className="flex min-w-0 flex-col gap-6">
          <Inline gap="sm" align="center" wrap>
            <Image
              src="/brand/luc-ui-logo-light-64.png"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="size-7 dark:hidden"
            />
            <Image
              src="/brand/luc-ui-logo-dark-64.png"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="hidden size-7 dark:block"
            />
            <Badge tone="accent" dot size="sm">
              Luc UI
            </Badge>
            <Text variant="micro" tone="muted" as="span">
              {tcs("React · TypeScript · English and Simplified Chinese")}
            </Text>
          </Inline>

          <h1 className="font-display text-[clamp(2.6rem,5.4vw,4.6rem)] leading-[0.98] font-semibold tracking-[-0.038em] text-fg-primary text-balance">
            {tcs("Precision meets expression.")}
          </h1>

          <Text variant="body-lg" tone="secondary" className="max-w-[58ch] text-pretty">
            {tcs(
              "Every LUC interface starts from one system: tokens, accessible components, spatial motion, professional charts and whole reference products — documented one page at a time.",
            )}
          </Text>

          <Inline gap="sm" wrap>
            <Link
              href={href("/components")}
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              {tcs("Browse the components")}
            </Link>
            <Link href={href("/charts")} className={buttonVariants({ variant: "accent", size: "lg" })}>
              {tcs("See the charts")}
            </Link>
            {/*
              * Search is an action, not a destination.
              *
              * The third slot used to be a link to `/explore` labelled "Find the
              * right thing" — a promise of search that led to an introductory
              * page, where the reader had to find the field. This opens the real
              * global palette, the same one ⌘K opens, and says so with the
              * shortcut on the button.
              */}
            <HomeSearchAction />
          </Inline>

          <div className="flex max-w-[30rem] items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface-sunken px-3 py-2">
            <code className="font-mono text-caption text-fg-secondary">
              {'import { Button } from "@luc/ui";'}
            </code>
            <CopyButton value={'import { Button } from "@luc/ui";'} label={tcs("Copy import")} />
          </div>
        </div>

        {/*
          * The specimen sheet.
          *
          * Four families on one hairline field: an action row, a status row, a
          * metric and a density detail. Each is the real component from `@luc/ui`
          * — if the library changes, this changes with it, which is a stronger
          * claim than a screenshot can make.
          */}
        <div className="grid gap-px overflow-hidden rounded-xl border border-line-subtle bg-line-subtle">
          {/* "Six intents" because that is what `buttonVariants` publishes: the
           * label counted a variant set that the recipe no longer has, which is
           * the kind of number a screenshot cannot contradict. */}
          <SpecimenCell label={tcs("Actions · six intents")}>
            <Inline gap="sm" wrap>
              <Button variant="primary" size="sm">
                {tcs("Save view")}
              </Button>
              <Button variant="secondary" size="sm">
                {tcs("Export")}
              </Button>
              <Button variant="ghost" size="sm">
                {tcs("Reset")}
              </Button>
            </Inline>
          </SpecimenCell>

          <SpecimenCell label={tcs("Status · never colour alone")}>
            <Inline gap="sm" wrap>
              <Badge tone="positive" dot size="md">
                {tcs("Stable")}
              </Badge>
              <Badge tone="warning" size="md">
                {tcs("Degraded")}
              </Badge>
              <Badge tone="outline" size="md">
                {tcs("Draft")}
              </Badge>
            </Inline>
          </SpecimenCell>

          <SpecimenCell label={tcs("Numbers · tabular by default")}>
            <Metric label={tcs("Monthly retention")} aside={<Delta value={2.4} />}>
              <MetricValue value={0.914} kind="percent" size="lg" />
            </Metric>
          </SpecimenCell>

          <SpecimenCell label={tcs("Density · one radius scale")}>
            <div className="flex w-full flex-col gap-3">
              <SegmentedControl size="sm" aria-label={tcs("Density")} defaultValue="layered">
                <SegmentedItem size="sm" value="flat">
                  {tcs("Flat")}
                </SegmentedItem>
                <SegmentedItem size="sm" value="layered">
                  {tcs("Layered")}
                </SegmentedItem>
                <SegmentedItem size="sm" value="deep">
                  {tcs("Deep")}
                </SegmentedItem>
              </SegmentedControl>
              <Progress value={62} aria-label={tcs("Coverage")} />
            </div>
          </SpecimenCell>
        </div>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-xl border border-line-subtle bg-line-subtle sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.id}
            className="flex flex-col gap-0.5 bg-surface-default px-5 py-4"
            data-testid={`home-fact-${fact.id}`}
          >
            <dt className="text-caption text-fg-muted">{fact.label}</dt>
            <dd className="luc-numeric font-display text-display-sm text-fg-primary">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** One cell of the specimen sheet: a mono label over a live component. */
function SpecimenCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 bg-surface-default px-5 py-4">
      <Heading size="title" as="p" className="text-micro text-fg-muted uppercase">
        {label}
      </Heading>
      <div className="flex min-h-[4.5rem] items-center">{children}</div>
    </div>
  );
}
