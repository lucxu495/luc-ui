/*
 * Blocks: one functional page section each.
 *
 * The distinction Phase 9 draws, in one place:
 *
 *   Component — a primitive with typed props (`Button`, `DataTable`).
 *   Block     — a *section* of a page, assembled from components, that solves
 *               one job: a hero, a pricing band, a publication list.
 *   Template  — a whole page or site composed from components and Blocks.
 *
 * A Block is a recipe, not a package export. That is deliberate: a hero that
 * ships as an npm export is a hero a library has to version, document and
 * support forever. These are published as *source you can read* — each one
 * lists the exports it uses, so the honest path to reuse it is to open the
 * file, copy the shape and wire it to your own data.
 *
 * Every block is a server component with no state and no data fetching, so it
 * renders identically on the server and the client, and a Preview Gallery can
 * show twenty of them without shipping twenty interactive islands.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
  Heading,
  Inline,
  Metric,
  MetricValue,
  Section,
  Stack,
  StatCard,
  Text,
  Timeline,
  buttonVariants,
} from "@luc/ui";
import {
  ExperienceTimeline,
  NowSection,
  ProfileHero,
  PublicationList,
  ReadingShelf,
} from "@luc/ui/experiences";
import Link from "next/link";

/* ------------------------------------------------------------------ marketing */

/**
 * The localizer, passed in like `href`.
 *
 * A Block is specimen source: it has to render the same in the Showcase, on the
 * server, and in a product that has never heard of this dictionary. So it does
 * not reach for a hook — the gallery and the composer hand it their `tcs`, and a
 * caller that has none gets the English source unchanged.
 */
export type BlockCopy = (source: string) => string;

const identityCopy: BlockCopy = (source) => source;

export function HeroBanner({
  href = (target: string) => target,
  tcs = identityCopy,
}: {
  href?: (target: string) => string;
  tcs?: BlockCopy;
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-2">
      <Badge tone="accent" size="sm" dot>
        {tcs("New")}
      </Badge>
      <Heading size="display" as="h3" className="max-w-[20ch] text-balance">
        {tcs("Ship the interface, not the design review")}
      </Heading>
      <Text variant="body-lg" tone="muted" as="p" className="max-w-[52ch]">
        {tcs("A section that states one claim, proves it in the subhead and offers exactly one next step.")}
      </Text>
      <Inline gap="sm">
        <Link href={href("/docs/installation")} className={buttonVariants({ variant: "primary", size: "lg" })}>
          {tcs("Start building")}
        </Link>
        <Link href={href("/components")} className={buttonVariants({ variant: "ghost", size: "lg" })}>
          {tcs("Browse components")}
        </Link>
      </Inline>
    </div>
  );
}

export function FeatureGrid({ tcs = identityCopy }: { tcs?: BlockCopy } = {}) {
  const features = [
    { title: tcs("Tokens first"), body: tcs("Every value is a named role, in both themes.") },
    { title: tcs("Keyboard honest"), body: tcs("Focus, roving tabindex and announcements ship with the primitive.") },
    { title: tcs("Server safe"), body: tcs("No component reaches for the window during render.") },
  ];
  return (
    <Grid columns={3} gap="md">
      {features.map((feature) => (
        <Stack key={feature.title} gap="xs">
          <Heading size="title" as="h3">
            {feature.title}
          </Heading>
          <Text variant="caption" tone="muted" as="p">
            {feature.body}
          </Text>
        </Stack>
      ))}
    </Grid>
  );
}

export function StatsStrip() {
  const stats = [
    { label: "Deploys this week", value: 1284, delta: 12.4 as number | null },
    { label: "p95 response", value: 182, suffix: " ms", delta: -8.1 as number | null },
    { label: "Open incidents", value: 0, delta: null },
  ];
  return (
    <Grid columns={3} gap="md">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          delta={stat.delta}
        />
      ))}
    </Grid>
  );
}

export function PricingBand({ tcs = identityCopy }: { tcs?: BlockCopy } = {}) {
  const tiers = [
    { id: "community", name: tcs("Community"), price: tcs("Free"), note: tcs("Everything in this documentation.") },
    { id: "team", name: tcs("Team"), price: tcs("Soon"), note: tcs("Not built, not sold, not promised.") },
  ];
  return (
    <Grid columns={2} gap="md">
      {tiers.map((tier) => (
        <Card key={tier.id} variant={tier.id === "community" ? "raised" : "outline"}>
          <CardHeader>
            <CardTitle>{tier.name}</CardTitle>
            <CardDescription>{tier.note}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Heading size="title" as="p">
              {tier.price}
            </Heading>
            <Button variant="outline" disabled={tier.id !== "community"}>
              {tier.id === "community" ? tcs("Read the docs") : tcs("Not available")}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Grid>
  );
}

/* ------------------------------------------------------------------- personal */

export function PersonalHeroBlock() {
  return (
    <ProfileHero
      name="Ada Okonkwo"
      title="Backend engineer, mostly databases"
      lead="I work on query planning and storage layout, and I write about both."
      facts={[
        { id: "now", label: "Now", value: "Query planning at a mid-size analytics company" },
        { id: "before", label: "Before", value: "Storage engine internals" },
        { id: "elsewhere", label: "Elsewhere", value: "Occasional long-form writing" },
      ]}
      links={[
        { id: "email", label: "Email", href: "mailto:ada@example.com" },
        { id: "github", label: "GitHub", href: "https://github.com/", handle: "ada" },
      ]}
    />
  );
}

export function CareerTimelineBlock() {
  return (
    <ExperienceTimeline
      items={[
        {
          id: "staff",
          role: "Staff engineer",
          org: "Analytics platform",
          from: "2023",
          current: true,
          summary: "Query planning, storage layout, and the parts of a database nobody demos.",
        },
        {
          id: "senior",
          role: "Senior engineer",
          org: "Storage team",
          from: "2019",
          to: "2023",
          summary: "Compaction, replication and an unhealthy amount of benchmarking.",
        },
      ]}
    />
  );
}

export function PublicationBlock() {
  return (
    <PublicationList
      filters={false}
      publications={[
        {
          id: "compaction",
          title: "Measuring compaction cost honestly",
          authors: "A. Okonkwo",
          venue: "Internal engineering blog",
          year: 2024,
          kind: "Article",
          topics: ["storage"],
        },
        {
          id: "planner",
          title: "A planner for small data",
          authors: "A. Okonkwo, R. Iyer",
          venue: "Workshop proceedings",
          year: 2022,
          kind: "Conference paper",
          topics: ["query planning"],
        },
      ]}
    />
  );
}

export function NowBlock() {
  return (
    <NowSection
      updatedAt="2026-10-01"
      items={[
        { id: "reading", label: "Reading", value: "Designing Data-Intensive Applications, again" },
        { id: "building", label: "Building", value: "A query planner with a readable cost model" },
      ]}
    />
  );
}

export function ReadingShelfBlock() {
  return (
    <ReadingShelf
      items={[
        { id: "db-internals", title: "Database Internals", author: "Alex Petrov", status: "reading", progress: 0.42 },
        { id: "everyday-things", title: "The Design of Everyday Things", author: "Don Norman", status: "finished" },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ product */

export function ActivityFeedBlock() {
  const events = [
    { id: "deploy", title: "Deploy finished", detail: "web-2026.10.9 in 78 s", time: "2026-10-09T09:12:00Z" },
    { id: "incident", title: "Incident resolved", detail: "Elevated p95 on the read path", time: "2026-10-08T17:40:00Z" },
    { id: "review", title: "Review requested", detail: "Compaction cost model", time: "2026-10-08T11:05:00Z" },
  ];
  return (
    <Timeline
      items={events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.detail,
        meta: event.time.slice(0, 10),
      }))}
    />
  );
}

export function MetricBandBlock() {
  return (
    <Inline gap="lg" wrap>
      <Metric label="Requests">
        <MetricValue value={18400000} kind="compact" />
      </Metric>
      <Metric label="Error rate">
        <MetricValue value={0.0002} kind="percent" />
      </Metric>
      <Metric label="Assets covered">
        <MetricValue value={48} />
      </Metric>
    </Inline>
  );
}

export function ConsoleHeaderBlock({ tcs = identityCopy }: { tcs?: BlockCopy } = {}) {
  return (
    /*
     * The last block to take the localizer, for the same reason the other three
     * do: its copy is what a reader sees on the gallery card, and the module may
     * not reach for a hook (see `BlockCopy`). Its sibling blocks were converted
     * when the gallery was localized; this one kept three English labels, which
     * the runtime probe went on reporting.
     */
    <Section
      title={tcs("Deployments")}
      description={tcs("A section header with one action, which is all most console pages need.")}
    >
      <Inline gap="sm">
        <Button variant="primary" size="sm">
          {tcs("New deployment")}
        </Button>
        <Button variant="ghost" size="sm">
          {tcs("Export")}
        </Button>
      </Inline>
    </Section>
  );
}
