"use client";

import { useOptionalI18n } from "@/lib/i18n/provider";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Code,
  DataTable,
  Delta,
  Inline,
  Input,
  Metric,
  MetricValue,
  NumericText,
  Panel,
  Sparkline,
  StatusBadge,
  Switch,
  Tag,
  Text,
  numericColumn,
  textColumn,
} from "@luc/ui";
import { RiAddLine, RiCheckLine, RiHeart3Line, RiLoopRightLine, RiSparklingLine } from "@remixicon/react";

/**
 * Four products, one component set.
 *
 * These vignettes exist to answer a specific doubt: is LUC UI a financial
 * dashboard library that happens to have buttons, or a general one that is
 * unusually good at data? Each card below is built only from the public API, and
 * each one is scoped to its own palette and type voice — the wrapper sets two
 * attributes and the whole vignette adopts a different brand. No component here
 * knows it is being reused in a shop, a newsroom or a research desk.
 */

/* ---------------------------------------------------------------------------
 * AI & developer tools — cobalt, technical mono
 * ------------------------------------------------------------------------- */

const RUN_STEPS = [
  { label: "Read 42 files in luc-api/src", status: "healthy" as const },
  { label: "Draft the migration plan", status: "healthy" as const },
  { label: "Apply 6 patches", status: "pending" as const },
];

export function AiDeveloperVignette() {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader
        icon={<RiSparklingLine />}
        actions={<StatusBadge status="live" size="sm" />}
      >
        <CardTitle>{tcs("Migrate the serving layer to V3")}</CardTitle>
        <Text variant="caption" tone="muted">
          Agent run · 4 min 12 s · 18,402 tokens
        </Text>
      </CardHeader>

      <CardContent className="gap-4">
        <div className="flex flex-col gap-2">
          {RUN_STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center rounded-full border border-line-subtle bg-surface-sunken font-mono text-micro text-fg-muted"
              >
                {index + 1}
              </span>
              <Text variant="caption" className="min-w-0 flex-1 truncate">
                {tcs(step.label)}
              </Text>
              <StatusBadge status={step.status} size="sm" />
            </div>
          ))}
        </div>

        <Code block>{`- return composePage(payload)
+ const page = await materialize(payload)
+ return composePage(page, { generation })`}</Code>

        <div className="flex items-center gap-2">
          <Input size="sm" placeholder="Tell the agent what to change next…" aria-label="Agent instruction" />
          <Button size="sm" variant="primary" leadingIcon={<RiLoopRightLine />}>
            Send
          </Button>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <label className="flex items-center gap-2 text-caption text-fg-secondary">
          <Switch defaultChecked aria-label="Auto-apply patches" />
          Auto-apply patches
        </label>
        <Inline gap="sm">
          <Button size="sm" variant="ghost">
            Discard
          </Button>
          <Button size="sm" variant="accent" leadingIcon={<RiCheckLine />}>
            Approve run
          </Button>
        </Inline>
      </CardFooter>
    </Card>
  );
}

/* ---------------------------------------------------------------------------
 * Commerce & lifestyle — rose, humanist system
 * ------------------------------------------------------------------------- */

const PRODUCTS = [
  { name: "Field notebook, A5", price: 24, compare: 32, tag: "New", stock: "In stock" as const },
  { name: "Ceramic pour-over set", price: 68, compare: null, tag: "Low stock", stock: "degraded" as const },
];

export function CommerceVignette() {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {PRODUCTS.map((product) => (
          <Card key={product.name} padding="none" interaction="interactive" className="overflow-hidden">
            <div className="relative flex h-28 items-center justify-center bg-accent-soft">
              <span aria-hidden="true" className="size-10 rounded-lg border border-line-accent bg-surface-raised" />
              <Badge tone="neutral" size="sm" className="absolute top-2 left-2 bg-surface-overlay">
                {product.tag}
              </Badge>
            </div>
            <CardContent className="gap-2">
              <Text variant="label" className="font-medium">
                {product.name}
              </Text>
              <Inline gap="sm" className="items-baseline">
                <NumericText value={product.price} kind="currency" currency="USD" className="text-title" />
                {product.compare ? (
                  <Text variant="caption" tone="muted" className="line-through">
                    <NumericText value={product.compare} kind="currency" currency="USD" />
                  </Text>
                ) : null}
              </Inline>
              <div className="flex flex-wrap gap-1.5">
                {["S", "M", "L"].map((size) => (
                  <Tag key={size} className="h-5 px-1.5 text-micro">
                    {size}
                  </Tag>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <StatusBadge status={product.stock === "In stock" ? "healthy" : "degraded"} label={product.stock} size="sm" />
              <Button size="sm" variant="primary" leadingIcon={<RiAddLine />}>
                Add to bag
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Panel className="flex flex-wrap items-end justify-between gap-4 p-4">
        <Metric label="Bag" meta={tcs("2 items · free delivery over $50")} className="min-w-40 flex-1">
          <MetricValue value={92} kind="currency" currency="USD" size="md" />
        </Metric>
        <Button variant="accent">Checkout</Button>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Creator & community — ember, editorial serif
 * ------------------------------------------------------------------------- */

export function CreatorVignette() {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text variant="micro" tone="accent">
          Field notes
        </Text>
        <h3 className="font-display text-heading text-fg-primary text-balance">
          {tcs("The workshop where every prototype is allowed to fail")}
        </h3>
        <Text variant="body-lg" tone="secondary" className="max-w-[62ch]">
          {tcs("Most of what leaves this room is wrong. That is the arrangement: a prototype is a question, and the only prototype worth keeping is one that answers it in under a week.")}
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-y border-line-subtle py-3">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full border border-line-accent bg-accent-soft font-display text-caption text-fg-accent"
        >
          MR
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <Text variant="label" className="font-medium">
            Mira Okonkwo
          </Text>
          <Text variant="caption" tone="muted">
            {tcs("Studio lead · 8 min read")}
          </Text>
        </div>
        <Badge tone="accent" size="sm">
          Member
        </Badge>
        <Button size="sm" variant="accent" leadingIcon={<RiHeart3Line />}>
          Follow
        </Button>
      </div>

      <blockquote className="border-l-2 border-accent-default pl-4 font-display text-title text-fg-primary">
        {tcs("“A prototype that takes a month is a decision you have already made.”")}
      </blockquote>

      <div className="flex flex-wrap items-center gap-2">
        {["workshops", "prototyping", "craft"].map((topic) => (
          <Tag key={topic}>{topic}</Tag>
        ))}
        <Text variant="caption" tone="muted" className="ml-auto">
          1,204 responses
        </Text>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------------------
 * Finance & analytics — emerald, Inter
 * ------------------------------------------------------------------------- */

interface Holding {
  id: string;
  sleeve: string;
  weight: number;
  pnl: number;
}

const HOLDINGS: Holding[] = [
  { id: "core", sleeve: "Core equity", weight: 46.2, pnl: 3.4 },
  { id: "macro", sleeve: "Macro overlay", weight: 18.9, pnl: -1.2 },
  { id: "carry", sleeve: "Carry basket", weight: 12.4, pnl: 0.8 },
  { id: "duration", sleeve: "Duration hedge", weight: 9.1, pnl: -2.6 },
];

const HOLDING_COLUMNS = [
  textColumn<Holding, "sleeve">("sleeve", { header: "Sleeve", emphasis: true }),
  numericColumn<Holding, "weight">("weight", { header: "Weight", unit: "%", decimals: 1, size: 110 }),
  numericColumn<Holding, "pnl">("pnl", { header: "P&L", unit: "%", decimals: 1, tone: "signed", size: 110 }),
];

export function FinanceVignette() {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Portfolio">
          <MetricValue value={1284310} kind="currency" currency="USD" size="md" animate={false} />
          <Delta value={12.4} />
        </Metric>
        <Metric label="Volatility (30d)">
          <MetricValue value={0.112} kind="percent" size="md" animate={false} />
          <Delta value={-4.1} invert />
        </Metric>
        <Metric label="Equity curve" aside={<StatusBadge status="healthy" size="sm" />}>
          <Sparkline
            values={[42, 44, 41, 47, 52, 49, 56, 61, 58, 66]}
            tone="accent"
            marker
            height={36}
            ariaLabel="Equity curve"
          />
        </Metric>
      </div>

      <DataTable
        ariaLabel="Sleeve attribution"
        ariaDescription={tcs("Weight and contribution by sleeve.")}
        data={HOLDINGS}
        columns={HOLDING_COLUMNS}
        getRowId={(row) => row.id}
        density="compact"
        stickyHeader={false}
      />
    </div>
  );
}
