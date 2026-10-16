/*
 * Live Demos — Layout.
 *
 * `container`, `grid`, `inline`, `stack`, `section`, `panel`, `separator`,
 * `scroll-area`, `aspect-ratio`.
 *
 * The Layout family is the one a reader copies before they style anything, so
 * these specimens are written to answer three questions at a glance: *what
 * changes* when a prop changes, *how much* of it there is (a column count, a
 * gap, a measure — measured rather than asserted), and *what this looks like in
 * a real page* rather than floating in an empty stage.
 *
 * Two conventions worth knowing before reading on:
 *
 *  - a `Guide` is a dashed boundary with a corner label. It exists because the
 *    layout primitives are invisible by design; a box drawn around one, and the
 *    measurement under it from `MeasuredWidth`, is how the Showcase shows what
 *    the component actually did with the space.
 *  - every fixture label is one or two words (`Return`, `Sharpe`, `US large
 *    cap`). They are data, not documentation, and they stay short so a
 *    translated page does not have to carry a translation for them.
 */

import type { ReactNode } from "react";
import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  Grid,
  Inline,
  Panel,
  PanelBody,
  PanelHeader,
  ScrollArea,
  Section,
  Separator,
  Stack,
  Text,
  cn,
} from "@luc/ui";
import { MeasuredWidth } from "@/components/demo/islands/measure-demo";
import { composition, type DemoSpec } from "../index";

/** A dashed boundary with a corner label: the Showcase's drawing of an invisible box. */
function Guide({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-lg border border-dashed border-line-strong p-4 pt-5",
        className,
      )}
    >
      <span className="absolute -top-2 left-3 bg-surface-canvas px-1.5 text-micro text-fg-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

/** One labelled cell, for the grid, stack and gap specimens. */
function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-11 min-w-0 items-center justify-center rounded-md border border-line-subtle bg-surface-sunken px-3 py-2",
        className,
      )}
    >
      <Text variant="caption" tone="muted">
        {children}
      </Text>
    </div>
  );
}

/** A media placeholder drawn from tokens — no image file, no network request. */
function Frame({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("grid size-full place-items-center rounded-[inherit] bg-surface-sunken", className)}>
      <Text variant="micro" tone="muted">
        {label}
      </Text>
    </div>
  );
}

/**
 * The caption under a specimen: the props that produced it.
 *
 * Mono and lower case rather than the `micro` text variant, which is uppercase
 * by design — `RATIO="SQUARE"` reads as a shouted label, and the thing being
 * shown is code.
 */
function CodeLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-micro text-fg-muted">{children}</span>;
}

/** Six fixture names: enough to show any column count up to six. */
const CELLS = ["Return", "Volatility", "Sharpe", "Drawdown", "Exposure", "Turnover"];

/*
 * Every configuration on this page fills its stage.
 *
 * The example frame defaults to `inline` — a centred row of small specimens —
 * which is right for a Button and wrong for a layout primitive: a `Grid` or a
 * `Stack` in that stage is a flex item sized to its own content, so a
 * three-column grid drew 278 px wide and centred instead of showing what the
 * column count does with the width it is given. The rule is applied here, once,
 * rather than as thirty identical `layout: "block"` lines; an example that ever
 * needs a different stage still wins, because its own value is spread last.
 */
const layoutDemoSpecs: readonly DemoSpec[] = [
  /* ------------------------------------------------------------- container */
  composition({
    id: "container",
    title: "Width modes",
    layout: "block",
    note: "`content` is the page's own column, `prose` a readable line, `full` whatever the parent gives it. The numbers are the boxes the browser actually produced in this column — so `content` and `full` agree here, and the two stop agreeing as soon as the window is wider than the column below them.",
    code: `<Container width="content">…</Container>
<Container width="prose">…</Container>
<Container width="full">…</Container>`,
    node: (
      <Stack gap="lg">
        <MeasuredWidth
          width="content"
          label="content box"
          caption="The page column: at most 76rem, then the viewport."
          boxClassName="border border-dashed border-line-strong py-4"
          className="w-full"
        />
        <MeasuredWidth
          width="prose"
          label="content box"
          caption="A readable line: 44rem, the same measure the prose pages use."
          boxClassName="border border-dashed border-line-strong py-4"
          className="w-full"
        />
        <MeasuredWidth
          width="full"
          label="content box"
          caption="No maximum of its own: it takes the width it is given."
          boxClassName="border border-dashed border-line-strong py-4"
          className="w-full"
        />
      </Stack>
    ),
    examples: [
      {
        title: "Gutters",
        note: "The gutter is the horizontal padding, and it is the difference between these two numbers: the content box is measured inside it, so switching it off returns exactly two paddings to the content.",
        code: `<Container gutter>…</Container>
<Container gutter={false}>…</Container>`,
        node: (
          <Grid columns={2} gap="lg">
            <MeasuredWidth
              label="content box"
              caption="gutter on"
              boxClassName="bg-surface-sunken py-3"
              className="w-full"
            />
            <MeasuredWidth
              label="content box"
              caption="gutter off"
              boxClassName="bg-surface-sunken py-3"
              className="w-full"
            />
          </Grid>
        ),
      },
      {
        title: "Nesting",
        note: "A container inside a container is not a mistake: the inner one takes the narrower of the two measures and centres itself in it, which is how a readable paragraph sits inside a wide page column.",
        code: `<Container width="content">
  <Card className="p-4">
    <Container width="prose">…</Container>
  </Card>
</Container>`,
        node: (
          <Container width="content" className="border border-dashed border-line-strong py-4">
            <Card className="p-4">
              <MeasuredWidth
                width="prose"
                label="inner content box"
                caption="The inner measure wins where it is narrower, and the outer one is what stops the page growing on a very wide screen."
                boxClassName="py-3"
                className="w-full"
              />
            </Card>
          </Container>
        ),
      },
      {
        title: "A page shell",
        note: "What the component is for: one column, one gutter, and the sections inside it spaced by `Stack` rather than each one inventing its own padding.",
        code: `<Container width="content">
  <Stack gap="xl">
    <Section title="Overview" description="Four measurements, one lookback.">
      <Grid columns={4} gap="md">…</Grid>
    </Section>
    <Section title="Constituents">…</Section>
  </Stack>
</Container>`,
        node: (
          <Container width="content" className="border border-dashed border-line-strong py-4">
            <Stack gap="xl">
              <Section title="Overview" description="Four measurements, one lookback.">
                <Grid columns={4} gap="md">
                  {CELLS.slice(0, 4).map((cell) => (
                    <Cell key={cell}>{cell}</Cell>
                  ))}
                </Grid>
              </Section>
              <Section title="Constituents" description="Sixty-one instruments, quarterly rebalance.">
                <Panel tone="sunken" className="p-4">
                  <Text variant="caption" tone="muted">
                    US large cap
                  </Text>
                </Panel>
              </Section>
            </Stack>
          </Container>
        ),
      },
    ],
  }),

  /* ------------------------------------------------------------------ grid */
  composition({
    id: "grid",
    title: "Column counts",
    layout: "block",
    note: "The column count is a prop, and the breakpoint stack behind it is the component's decision — each count collapses one step before it has to.",
    code: `<Grid columns={2} gap="md">…</Grid>
<Grid columns={3} gap="md">…</Grid>
<Grid columns={4} gap="md">…</Grid>
<Grid columns={6} gap="md">…</Grid>`,
    node: (
      <Stack gap="lg">
        <Guide label="columns=2">
          <Grid columns={2} gap="md">
            {CELLS.slice(0, 2).map((cell) => (
              <Cell key={cell}>{cell}</Cell>
            ))}
          </Grid>
        </Guide>
        <Guide label="columns=3">
          <Grid columns={3} gap="md">
            {CELLS.slice(0, 3).map((cell) => (
              <Cell key={cell}>{cell}</Cell>
            ))}
          </Grid>
        </Guide>
        <Guide label="columns=4">
          <Grid columns={4} gap="md">
            {CELLS.slice(0, 4).map((cell) => (
              <Cell key={cell}>{cell}</Cell>
            ))}
          </Grid>
        </Guide>
        <Guide label="columns=6">
          <Grid columns={6} gap="md">
            {CELLS.map((cell) => (
              <Cell key={cell} className="min-h-9">
                {cell}
              </Cell>
            ))}
          </Grid>
        </Guide>
      </Stack>
    ),
    examples: [
      {
        title: "Gap scale",
        note: "One scale, shared with `Stack` and `Inline`, so a page cannot end up with four different ideas of what a gap is.",
        code: `<Grid columns={3} gap="sm">…</Grid>
<Grid columns={3} gap="md">…</Grid>
<Grid columns={3} gap="lg">…</Grid>
<Grid columns={3} gap="xl">…</Grid>`,
        node: (
          <Grid columns={2} gap="lg">
            {(["sm", "md", "lg", "xl"] as const).map((gap) => (
              <Guide key={gap} label={`gap=${gap}`}>
                <Grid columns={3} gap={gap}>
                  {CELLS.slice(0, 3).map((cell) => (
                    <Cell key={cell} className="min-h-8">
                      {cell}
                    </Cell>
                  ))}
                </Grid>
              </Guide>
            ))}
          </Grid>
        ),
      },
      {
        title: "Auto-fit tracks",
        note: "`minItemWidth` is the other way to decide a grid: instead of a column count, a minimum cell width, and the browser fits as many as will go. Narrow the window and the count changes on its own.",
        code: `<Grid minItemWidth="sm">…</Grid>
<Grid minItemWidth="md">…</Grid>
<Grid minItemWidth="lg">…</Grid>`,
        node: (
          <Stack gap="lg">
            {(["sm", "md", "lg"] as const).map((size) => (
              <Guide key={size} label={`minItemWidth=${size}`}>
                <Grid minItemWidth={size} gap="md">
                  {CELLS.map((cell) => (
                    <Cell key={cell} className="min-h-9">
                      {cell}
                    </Cell>
                  ))}
                </Grid>
              </Guide>
            ))}
          </Stack>
        ),
      },
      {
        title: "A cell that spans",
        note: "A grid has no span prop, and it does not need one: a cell is an ordinary element, so `sm:col-span-2` on the thing inside it is the whole mechanism.",
        code: `<Grid columns={4} gap="md">
  <Panel className="sm:col-span-2 lg:col-span-3">…</Panel>
  <Panel>…</Panel>
</Grid>`,
        node: (
          <Grid columns={4} gap="md">
            <Panel className="p-4 sm:col-span-2 lg:col-span-3">
              <Stack gap="2xs">
                <Text variant="label">Risk report</Text>
                <Text variant="caption" tone="muted">
                  Three of four columns
                </Text>
              </Stack>
            </Panel>
            <Panel tone="sunken" className="p-4">
              <Text variant="caption" tone="muted">
                One column
              </Text>
            </Panel>
          </Grid>
        ),
      },
      {
        title: "A card wall",
        note: "The composition the component exists for: equal cards, one gap, and a cell that grows with its own content instead of a fixed height.",
        code: `<Grid columns={3} gap="md">
  {factors.map((factor) => (
    <Card key={factor.name} className="gap-1 p-4">…</Card>
  ))}
</Grid>`,
        node: (
          <Grid columns={3} gap="md">
            {[
              { title: "Momentum", body: "12-1 total return", delta: "+4.8%" },
              { title: "Value", body: "Book to price", delta: "-1.2%" },
              { title: "Quality", body: "Gross profitability", delta: "+0.9%" },
            ].map((factor) => (
              <Card key={factor.title} className="gap-1 p-4">
                <Text variant="label">{factor.title}</Text>
                <Text variant="caption" tone="muted">
                  {factor.body}
                </Text>
                <Text variant="body" tone={factor.delta.startsWith("-") ? "negative" : "positive"}>
                  {factor.delta}
                </Text>
              </Card>
            ))}
          </Grid>
        ),
      },
    ],
  }),

  /* ---------------------------------------------------------------- inline */
  composition({
    id: "inline",
    title: "Gaps and alignment",
    layout: "block",
    note: "A row that wraps. The gap is the same scale `Grid` and `Stack` use, and alignment is one prop rather than a class on each item.",
    code: `<Inline gap="xs">…</Inline>
<Inline gap="sm">…</Inline>
<Inline gap="md">…</Inline>
<Inline gap="lg">…</Inline>`,
    node: (
      <Stack gap="md">
        {(["xs", "sm", "md", "lg"] as const).map((gap) => (
          <Guide key={gap} label={`gap=${gap}`}>
            <Inline gap={gap} align="center">
              <Cell className="min-h-9">Return</Cell>
              <Cell className="min-h-9">Volatility</Cell>
              <Cell className="min-h-9">Sharpe</Cell>
            </Inline>
          </Guide>
        ))}
      </Stack>
    ),
    examples: [
      {
        title: "Alignment",
        note: "`baseline` is the one that earns its keep: a caption, a value and a chip sit on one line of type instead of on one box edge.",
        code: `<Inline align="center">…</Inline>
<Inline align="baseline">…</Inline>
<Inline align="end">…</Inline>`,
        node: (
          <Stack gap="md">
            {(["center", "baseline", "end"] as const).map((align) => (
              <Guide key={align} label={`align=${align}`}>
                <Inline gap="md" align={align} className="min-h-16">
                  <Text variant="caption" tone="muted">
                    Lookback
                  </Text>
                  <Text variant="body">200 weeks</Text>
                  <Panel tone="raised" className="px-2 py-3">
                    <Text variant="micro" tone="muted">
                      weeks
                    </Text>
                  </Panel>
                </Inline>
              </Guide>
            ))}
          </Stack>
        ),
      },
      {
        title: "Distribution",
        note: "Justification is what turns a cluster into a row: `between` puts the label on one edge and the action on the other, which is the header pattern a card repeats forever.",
        code: `<Inline justify="start">…</Inline>
<Inline justify="center">…</Inline>
<Inline justify="end">…</Inline>
<Inline justify="between">…</Inline>`,
        node: (
          <Stack gap="md">
            {(["start", "center", "end", "between"] as const).map((justify) => (
              <Guide key={justify} label={`justify=${justify}`}>
                <Inline gap="sm" justify={justify} className="w-full">
                  <Badge tone="neutral" size="sm">
                    Draft
                  </Badge>
                  <Text variant="caption" tone="muted">
                    61 instruments
                  </Text>
                </Inline>
              </Guide>
            ))}
          </Stack>
        ),
      },
      {
        title: "Wrapping",
        note: "`wrap` is the difference between a row that grows downwards and a row that keeps its height. Both boxes below are narrower than their contents on purpose.",
        code: `<Inline wrap>…</Inline>
<Inline wrap={false}>…</Inline>`,
        node: (
          <Grid columns={2} gap="lg">
            <Guide label="wrap">
              <Inline gap="sm" wrap className="max-w-full">
                {["BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "MSFT", "NVDA"].map((symbol) => (
                  <Badge key={symbol} tone="neutral" size="sm">
                    {symbol}
                  </Badge>
                ))}
              </Inline>
            </Guide>
            <Guide label="wrap=false">
              <div className="overflow-hidden">
                <Inline gap="sm" wrap={false}>
                  {["BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "MSFT", "NVDA"].map((symbol) => (
                    <Badge key={symbol} tone="neutral" size="sm">
                      {symbol}
                    </Badge>
                  ))}
                </Inline>
              </div>
            </Guide>
          </Grid>
        ),
      },
      {
        title: "A metadata row",
        note: "The composition it was written for: label and value pairs, a vertical rule between groups, and a status badge at the end — all on one line that wraps when it must.",
        code: `<Inline gap="md" align="center" wrap>
  <Text variant="caption" tone="muted">Lookback</Text>
  <Text variant="body">200 weeks</Text>
  <Separator orientation="vertical" className="h-4" />
  <Text variant="caption" tone="muted">Universe</Text>
  <Text variant="body">US large cap</Text>
  <Separator orientation="vertical" className="h-4" />
  <Badge tone="positive" size="sm">Live</Badge>
</Inline>`,
        node: (
          <Inline gap="md" align="center" wrap>
            <Text variant="caption" tone="muted">
              Lookback
            </Text>
            <Text variant="body">200 weeks</Text>
            <Separator orientation="vertical" className="h-4" />
            <Text variant="caption" tone="muted">
              Universe
            </Text>
            <Text variant="body">US large cap</Text>
            <Separator orientation="vertical" className="h-4" />
            <Badge tone="positive" size="sm">
              Live
            </Badge>
          </Inline>
        ),
      },
    ],
  }),

  /* ----------------------------------------------------------------- stack */
  composition({
    id: "stack",
    title: "Vertical rhythm",
    layout: "block",
    note: "Spacing between siblings, owned in one place. The scale is shared with `Grid` and `Inline`, and the only thing a `Stack` decides is the gap.",
    code: `<Stack gap="xs">…</Stack>
<Stack gap="sm">…</Stack>
<Stack gap="md">…</Stack>
<Stack gap="lg">…</Stack>
<Stack gap="xl">…</Stack>`,
    node: (
      <Grid columns={3} gap="lg">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((gap) => (
          <Guide key={gap} label={`gap=${gap}`}>
            <Stack gap={gap}>
              <Cell className="min-h-8">Return</Cell>
              <Cell className="min-h-8">Volatility</Cell>
              <Cell className="min-h-8">Sharpe</Cell>
            </Stack>
          </Guide>
        ))}
      </Grid>
    ),
    examples: [
      {
        title: "Alignment",
        note: "`stretch` is what a bare flex column already does; naming it is what lets a footer sit at the bottom of a row of unequal cards.",
        code: `<Stack align="start">…</Stack>
<Stack align="center">…</Stack>
<Stack align="end">…</Stack>
<Stack align="stretch">…</Stack>`,
        node: (
          <Grid columns={2} gap="lg">
            {(["start", "center", "end", "stretch"] as const).map((align) => (
              <Guide key={align} label={`align=${align}`}>
                <Stack gap="sm" align={align}>
                  <Cell className="min-h-8 w-32">Short</Cell>
                  <Cell className="min-h-12 w-48">Wider cell</Cell>
                </Stack>
              </Guide>
            ))}
          </Grid>
        ),
      },
      {
        title: "Nesting",
        note: "Two gaps, two jobs: the outer `lg` separates topics, the inner `xs` keeps a label with the value it names. It is the one pattern that replaces three ad-hoc margins on every page.",
        code: `<Stack gap="lg">
  <Stack gap="xs">
    <Text variant="caption" tone="muted">Lookback</Text>
    <Text variant="body">200 weeks</Text>
  </Stack>
</Stack>`,
        node: (
          <Guide label="outer gap=lg, inner gap=xs">
            <Stack gap="lg">
              {[
                ["Lookback", "200 weeks"],
                ["Rebalance", "Monthly"],
                ["Universe", "US large cap"],
              ].map(([label, value]) => (
                <Stack gap="xs" key={label}>
                  <Text variant="caption" tone="muted">
                    {label}
                  </Text>
                  <Text variant="body">{value}</Text>
                </Stack>
              ))}
            </Stack>
          </Guide>
        ),
      },
      {
        title: "A semantic list",
        note: "`as` changes the element and nothing else, so a stack of factors can be a real `<ul>` with real `<li>` rows — which is what lets a screen reader count them out loud.",
        code: `<Stack as="ul" gap="sm">
  <li>
    <Stack gap="2xs">
      <Text variant="label">Momentum</Text>
      <Text variant="caption" tone="muted">12-1 total return</Text>
    </Stack>
  </li>
</Stack>`,
        node: (
          <Panel className="p-4">
            <Stack as="ul" gap="sm" className="list-none">
              {[
                { name: "Momentum", body: "12-1 total return" },
                { name: "Value", body: "Book to price" },
                { name: "Quality", body: "Gross profitability" },
              ].map((factor) => (
                <li key={factor.name}>
                  <Stack gap="2xs">
                    <Text variant="label">{factor.name}</Text>
                    <Text variant="caption" tone="muted">
                      {factor.body}
                    </Text>
                  </Stack>
                </li>
              ))}
            </Stack>
          </Panel>
        ),
      },
    ],
  }),

  /* --------------------------------------------------------------- section */
  composition({
    id: "section",
    title: "A titled band",
    layout: "block",
    note: "The heading rhythm a page repeats: the section owns the space between its title, its description and its content, and the page owns the space *between* sections.",
    code: `<Section title="Position sizing" description="Half the risk, twice the breadth.">
  <Text variant="body">…</Text>
</Section>`,
    node: (
      <Section title="Position sizing" description="Half the risk, twice the breadth.">
        <Cell className="min-h-16">Content</Cell>
      </Section>
    ),
    examples: [
      {
        title: "With actions",
        note: "The action slot sits opposite the title and aligns with it, so a section header reads as one row instead of a heading with a button floating beside it.",
        code: `<Section
  title="Constituents"
  description="Sixty-one instruments, quarterly rebalance."
  actions={<Button size="sm" variant="outline">Export</Button>}
>
  <Grid columns={3} gap="md">…</Grid>
</Section>`,
        node: (
          <Section
            title="Constituents"
            description="Sixty-one instruments, quarterly rebalance."
            actions={
              <Button size="sm" variant="outline">
                Export
              </Button>
            }
          >
            <Grid columns={3} gap="md">
              {CELLS.slice(0, 3).map((cell) => (
                <Cell key={cell}>{cell}</Cell>
              ))}
            </Grid>
          </Section>
        ),
      },
      {
        title: "Spacing modes",
        note: "`gap` is the distance between the header and the content — tighter where a section holds a form, looser where it holds a chart.",
        code: `<Section title="Universe" description="Which instruments are in scope." gap="sm">…</Section>
<Section title="Universe" description="Which instruments are in scope." gap="md">…</Section>
<Section title="Universe" description="Which instruments are in scope." gap="lg">…</Section>`,
        node: (
          <Stack gap="xl">
            {(["sm", "md", "lg"] as const).map((gap) => (
              <Guide key={gap} label={`gap=${gap}`}>
                <Section title="Universe" description="Which instruments are in scope." gap={gap}>
                  <Cell className="min-h-10">US large cap</Cell>
                </Section>
              </Guide>
            ))}
          </Stack>
        ),
      },
      {
        title: "A page of sections",
        note: "The realistic composition: one column, three sections, each with a different density of content — a grid, a panel and a header with an action.",
        code: `<Stack gap="xl">
  <Section title="Overview" description="Four measurements, one lookback.">…</Section>
  <Section title="Data" description="Daily bars, adjusted for splits.">…</Section>
  <Section title="Schedule" actions={<Button size="sm">Edit</Button>}>…</Section>
</Stack>`,
        node: (
          <Stack gap="xl">
            <Section title="Overview" description="Four measurements, one lookback.">
              <Grid columns={4} gap="md">
                {CELLS.slice(0, 4).map((cell) => (
                  <Cell key={cell}>{cell}</Cell>
                ))}
              </Grid>
            </Section>
            <Section title="Data" description="Daily bars, adjusted for splits.">
              <Panel tone="sunken" className="p-4">
                <Stack gap="xs">
                  <Text variant="caption" tone="muted">
                    Source
                  </Text>
                  <Text variant="body">luc_quant.market_candles_1d</Text>
                </Stack>
              </Panel>
            </Section>
            <Section
              title="Schedule"
              description="Monthly rebalance, nightly refresh."
              actions={
                <Button size="sm" variant="secondary">
                  Edit
                </Button>
              }
            >
              <Grid columns={2} gap="md">
                <Cell>Monthly</Cell>
                <Cell>02:00 UTC</Cell>
              </Grid>
            </Section>
          </Stack>
        ),
      },
    ],
  }),

  /* ----------------------------------------------------------------- panel */
  composition({
    id: "panel",
    title: "Surface tones",
    layout: "block",
    note: "Panel is the dense surface under everything else — a toolbar, a sidebar, a code block, a region inside a card. The tone says where it sits in the stack, not how important it is.",
    code: `<Panel tone="default">…</Panel>
<Panel tone="sunken">…</Panel>
<Panel tone="raised">…</Panel>`,
    node: (
      <Grid columns={3} gap="lg">
        {(["default", "sunken", "raised"] as const).map((tone) => (
          <div key={tone} className="flex min-w-0 flex-col gap-2">
            <Panel tone={tone} className="p-4">
              <Text variant="caption" tone="secondary">
                {tone}
              </Text>
            </Panel>
            <CodeLabel>{`tone=${tone}`}</CodeLabel>
          </div>
        ))}
      </Grid>
    ),
    examples: [
      {
        title: "Header, body and actions",
        note: "`PanelHeader` is the region's title bar: a minimum height, a hairline under it and a right-hand slot, which is what keeps a toolbar's controls in the same place on every panel in a product.",
        code: `<Panel>
  <PanelHeader actions={<Button size="sm" variant="ghost">Refresh</Button>}>
    <Text variant="label">Constituents</Text>
    <Badge tone="neutral" size="sm">61</Badge>
  </PanelHeader>
  <PanelBody>…</PanelBody>
</Panel>`,
        node: (
          <Panel>
            <PanelHeader
              actions={
                <Button size="sm" variant="ghost">
                  Refresh
                </Button>
              }
            >
              <Text variant="label">Constituents</Text>
              <Badge tone="neutral" size="sm">
                61
              </Badge>
            </PanelHeader>
            <PanelBody>
              <Stack gap="sm">
                {[
                  ["AAPL", "4.1%"],
                  ["MSFT", "3.8%"],
                  ["NVDA", "3.2%"],
                ].map(([symbol, weight]) => (
                  <Inline key={symbol} gap="sm" justify="between">
                    <Text variant="body">{symbol}</Text>
                    <Text variant="caption" tone="muted">
                      {weight}
                    </Text>
                  </Inline>
                ))}
              </Stack>
            </PanelBody>
          </Panel>
        ),
      },
      {
        title: "Panel or Card",
        note: "The distinction, shown with the same content: a Card is the surface a reader acts on, a Panel is a region inside one. A Panel never carries elevation, so a page cannot end up with two competing shadows.",
        code: `<Card>
  <CardHeader>
    <CardTitle>Card</CardTitle>
    <CardDescription>A surface with elevation</CardDescription>
  </CardHeader>
  <CardContent>
    <Panel tone="sunken">…</Panel>
  </CardContent>
</Card>`,
        node: (
          <Grid columns={2} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Card</CardTitle>
                <CardDescription>A surface with elevation</CardDescription>
              </CardHeader>
              <CardContent>
                <Panel tone="sunken" className="p-3">
                  <Text variant="caption" tone="secondary">
                    Panel inside a Card
                  </Text>
                </Panel>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">
                  Open
                </Button>
              </CardFooter>
            </Card>
            <Panel>
              <PanelHeader>
                <Text variant="label">Panel</Text>
              </PanelHeader>
              <PanelBody>
                <Stack gap="sm">
                  <Text variant="caption" tone="secondary">
                    A region, no elevation of its own
                  </Text>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </Stack>
              </PanelBody>
            </Panel>
          </Grid>
        ),
      },
      {
        title: "Nested regions",
        note: "A panel inside a panel separates two kinds of region with one hairline instead of a second border, a margin and a background — which is what keeps a dense tool screen legible.",
        code: `<Panel>
  <PanelHeader>…</PanelHeader>
  <PanelBody>
    <Panel tone="sunken">…</Panel>
  </PanelBody>
</Panel>`,
        node: (
          <Panel>
            <PanelHeader>
              <Text variant="label">Workspace</Text>
            </PanelHeader>
            <PanelBody>
              <Stack gap="md">
                <Panel tone="sunken" className="p-3">
                  <Text variant="caption" tone="secondary">
                    Nested region
                  </Text>
                </Panel>
                <Panel tone="sunken" className="p-3">
                  <Text variant="caption" tone="secondary">
                    Nested region
                  </Text>
                </Panel>
              </Stack>
            </PanelBody>
          </Panel>
        ),
      },
      {
        title: "Bordered and borderless",
        note: "`bordered={false}` is for a panel that already sits inside a framed surface: the frame is drawn once, by the outer region, and the inner one keeps only its background.",
        code: `<Panel tone="sunken">…</Panel>
<Panel tone="sunken" bordered={false}>…</Panel>`,
        node: (
          <Grid columns={2} gap="lg">
            <Panel tone="sunken" className="p-4">
              <Text variant="caption" tone="secondary">
                bordered
              </Text>
            </Panel>
            <Panel tone="sunken" bordered={false} className="p-4">
              <Text variant="caption" tone="secondary">
                bordered={"false"}
              </Text>
            </Panel>
          </Grid>
        ),
      },
    ],
  }),

  /* ------------------------------------------------------------- separator */
  composition({
    id: "separator",
    title: "Horizontal and vertical",
    layout: "block",
    note: "One hairline, in either direction. Horizontal separates blocks in a column, vertical separates groups inside a row — and both are drawn from the same line token, so their weight never disagrees.",
    code: `<Stack gap="md">
  <Text variant="body">Above the rule</Text>
  <Separator />
  <Text variant="body">Below the rule</Text>
</Stack>

<Inline gap="md" align="center">
  <Text variant="body">Left</Text>
  <Separator orientation="vertical" className="h-4" />
  <Text variant="body">Right</Text>
</Inline>`,
    node: (
      <Grid columns={2} gap="lg">
        <Guide label="horizontal">
          <Stack gap="md">
            <Text variant="body">Above the rule</Text>
            <Separator />
            <Text variant="body">Below the rule</Text>
          </Stack>
        </Guide>
        <Guide label="vertical">
          <Inline gap="md" align="center">
            <Text variant="body">Left</Text>
            <Separator orientation="vertical" className="h-4" />
            <Text variant="body">Right</Text>
          </Inline>
        </Guide>
      </Grid>
    ),
    examples: [
      {
        title: "The ornament variant",
        note: "A short centred rule with a dot, for the one place a full-width line would read as a structural boundary rather than a pause: between a page's blocks, never inside one.",
        code: `<Separator variant="ornament" />`,
        node: (
          <Stack gap="lg">
            <Text variant="body" tone="secondary">
              Forty-one instruments passed the liquidity screen.
            </Text>
            <Separator variant="ornament" />
            <Text variant="body" tone="secondary">
              The remaining nine were dropped for insufficient history.
            </Text>
          </Stack>
        ),
      },
      {
        title: "Between rows",
        note: "The other real use: a hairline between list rows instead of a border on every row. The list keeps one frame and the rows keep their rhythm.",
        code: `<Panel>
  <PanelBody className="py-0">
    <Stack gap="none">
      <Inline justify="between" className="py-2.5">…</Inline>
      <Separator />
      <Inline justify="between" className="py-2.5">…</Inline>
    </Stack>
  </PanelBody>
</Panel>`,
        node: (
          <Panel>
            <PanelBody className="py-0">
              <Stack gap="none">
                {[
                  ["AAPL", "4.1%"],
                  ["MSFT", "3.8%"],
                  ["NVDA", "3.2%"],
                ].map(([symbol, weight], index) => (
                  <div key={symbol} className="flex flex-col">
                    {index > 0 ? <Separator /> : null}
                    <Inline gap="sm" justify="between" className="py-2.5">
                      <Text variant="body">{symbol}</Text>
                      <Text variant="caption" tone="muted">
                        {weight}
                      </Text>
                    </Inline>
                  </div>
                ))}
              </Stack>
            </PanelBody>
          </Panel>
        ),
      },
      {
        title: "Weight and spacing",
        note: "Two things a caller can change about a hairline, and both are ordinary classes: a stronger line for a boundary that has to be seen, and tighter spacing where the content is already dense.",
        code: `<Separator />
<Separator className="bg-line-strong" />`,
        node: (
          <Stack gap="lg">
            <Guide label="line-default">
              <Stack gap="md">
                <Text variant="caption" tone="muted">
                  Default
                </Text>
                <Separator />
                <Text variant="caption" tone="muted">
                  Default
                </Text>
              </Stack>
            </Guide>
            <Guide label="line-strong">
              <Stack gap="md">
                <Text variant="caption" tone="muted">
                  Stronger boundary
                </Text>
                <Separator className="bg-line-strong" />
                <Text variant="caption" tone="muted">
                  Stronger boundary
                </Text>
              </Stack>
            </Guide>
          </Stack>
        ),
      },
    ],
  }),

  /* ----------------------------------------------------------- scroll-area */
  composition({
    id: "scroll-area",
    title: "Vertical scrolling",
    layout: "block",
    note: "A region that scrolls with a scrollbar the design system owns: one width, thumb and corner on every platform, sitting beside the content instead of over the last row.",
    height: 380,
    code: `<Panel>
  <PanelHeader>
    <Text variant="label">Instruments</Text>
    <Badge tone="neutral" size="sm">24</Badge>
  </PanelHeader>
  <ScrollArea className="h-64" viewportClassName="p-3">…</ScrollArea>
</Panel>`,
    node: (
      <Panel className="w-full">
        <PanelHeader>
          <Text variant="label">Instruments</Text>
          <Badge tone="neutral" size="sm">
            24
          </Badge>
        </PanelHeader>
        <ScrollArea className="h-64" viewportClassName="p-3">
          <Stack gap="none">
            {Array.from({ length: 24 }, (_, index) => (
              <Inline
                key={index}
                gap="sm"
                justify="between"
                className="border-b border-line-subtle py-2 last:border-b-0"
              >
                <Text variant="body">{`Instrument ${String(index + 1).padStart(2, "0")}`}</Text>
                <Text variant="caption" tone="muted">
                  {`${(index + 1) * 0.37}%`.slice(0, 4)}
                </Text>
              </Inline>
            ))}
          </Stack>
        </ScrollArea>
      </Panel>
    ),
    examples: [
      {
        title: "Horizontal scrolling",
        note: "`viewportClassName` is where the content's own padding and layout live. A wide table scrolls inside its box instead of widening the page — which is why this component sits under the DataTable. Shown with `type=\"always\"` so the bar is visible in a screenshot; the default is `hover`.",
        code: `<ScrollArea type="always" viewportClassName="p-3">
  <Grid columns={12} gap="sm" className="w-[64rem]">…</Grid>
</ScrollArea>`,
        node: (
          <ScrollArea
            type="always"
            className="rounded-lg border border-line-subtle"
            viewportClassName="p-3"
          >
            <Grid columns={12} gap="sm" className="w-[64rem]">
              {Array.from({ length: 12 }, (_, index) => (
                <Cell key={index} className="min-h-9">
                  {`C${index + 1}`}
                </Cell>
              ))}
            </Grid>
          </ScrollArea>
        ),
      },
      {
        title: "Both axes",
        note: "A region that is too wide *and* too tall gets two scrollbars and the corner that keeps them from overlapping — the case a bare `overflow-auto` box gets subtly wrong on every platform.",
        code: `<ScrollArea type="always" className="h-56" viewportClassName="p-3">
  <Grid columns={8} gap="sm" className="w-[72rem]">…</Grid>
</ScrollArea>`,
        node: (
          <ScrollArea
            type="always"
            className="h-56 rounded-lg border border-line-subtle"
            viewportClassName="p-3"
          >
            <Grid columns={8} gap="sm" className="w-[72rem]">
              {Array.from({ length: 48 }, (_, index) => (
                <Cell key={index} className="min-h-9">
                  {`R${index + 1}`}
                </Cell>
              ))}
            </Grid>
          </ScrollArea>
        ),
      },
      {
        title: "Scrollbar policy",
        note: "`type` decides when the scrollbar is visible: `hover` keeps it present but quiet, `always` reserves it so the there-is-more cue is there without touching the region.",
        code: `<ScrollArea type="hover" …>…</ScrollArea>
<ScrollArea type="always" …>…</ScrollArea>`,
        node: (
          <Grid columns={2} gap="lg">
            {(["hover", "always"] as const).map((type) => (
              <div key={type} className="flex min-w-0 flex-col gap-2">
                <ScrollArea
                  type={type}
                  className="h-40 rounded-lg border border-line-subtle"
                  viewportClassName="p-3"
                >
                  <Stack gap="sm">
                    {Array.from({ length: 10 }, (_, index) => (
                      <Text key={index} variant="caption" tone="muted">
                        {`Row ${index + 1}`}
                      </Text>
                    ))}
                  </Stack>
                </ScrollArea>
                <CodeLabel>{`type=${type}`}</CodeLabel>
              </div>
            ))}
          </Grid>
        ),
      },
      {
        title: "Long content",
        note: "What makes a scroll region worth naming: content long enough to scroll, a last row that is reachable, and the region itself a tab stop so a keyboard reader can reach it without a pointer.",
        code: `<ScrollArea className="h-48" viewportClassName="p-3">
  <Stack gap="md">…</Stack>
</ScrollArea>`,
        node: (
          <ScrollArea className="h-48 rounded-lg border border-line-subtle" viewportClassName="p-3">
            <Stack gap="md">
              <Text variant="label">Research notes</Text>
              {Array.from({ length: 6 }, (_, index) => (
                <Text key={index} variant="caption" tone="muted">
                  {/* The counter is a number and the sentence is a text node, so
                   * the one is data and the other is copy a dictionary can hold —
                   * a sentence built inside a template literal is invisible to
                   * both the extractor and the runtime localizer. */}
                  <span className="luc-numeric">{index + 1}</span> The region keeps its height
                  whatever the copy is.
                </Text>
              ))}
            </Stack>
          </ScrollArea>
        ),
      },
    ],
  }),

  /* ---------------------------------------------------------- aspect-ratio */
  composition({
    id: "aspect-ratio",
    title: "Ratio presets",
    layout: "block",
    note: "Six named ratios, drawn at the same width so the difference is the shape. The box is reserved before anything loads inside it, which is why a media card never moves when its image arrives.",
    code: `<AspectRatio ratio="square">…</AspectRatio>
<AspectRatio ratio="photo">…</AspectRatio>
<AspectRatio ratio="video">…</AspectRatio>
<AspectRatio ratio="wide">…</AspectRatio>
<AspectRatio ratio="ultrawide">…</AspectRatio>
<AspectRatio ratio="portrait">…</AspectRatio>`,
    node: (
      <Grid columns={3} gap="lg">
        {(
          [
            ["square", "1 : 1"],
            ["photo", "4 : 3"],
            ["video", "16 : 9"],
            ["wide", "21 : 9"],
            ["ultrawide", "32 : 9"],
            ["portrait", "3 : 4"],
          ] as const
        ).map(([ratio, notation]) => (
          <div key={ratio} className="flex min-w-0 flex-col gap-2">
            <AspectRatio ratio={ratio} className="rounded-lg border border-line-subtle">
              <Frame label={notation} />
            </AspectRatio>
            <CodeLabel>{`ratio="${ratio}"`}</CodeLabel>
          </div>
        ))}
      </Grid>
    ),
    examples: [
      {
        title: "A media card",
        note: "The composition it exists for: the frame holds the space, the card's header is an ordinary child, and the whole card is laid out before the media resolves.",
        code: `<Card className="overflow-hidden">
  <AspectRatio ratio="video">
    <img src="…" alt="…" className="size-full object-cover" />
  </AspectRatio>
  <CardHeader>
    <CardTitle>Momentum, 2019–2026</CardTitle>
    <CardDescription>Weekly, log scale</CardDescription>
  </CardHeader>
</Card>`,
        node: (
          <Grid columns={2} gap="lg">
            <Card className="overflow-hidden">
              <AspectRatio ratio="video">
                <Frame label="16 : 9" />
              </AspectRatio>
              <CardHeader>
                <CardTitle>Momentum, 2019–2026</CardTitle>
                <CardDescription>Weekly, log scale</CardDescription>
              </CardHeader>
            </Card>
            <Card className="overflow-hidden">
              <AspectRatio ratio="photo">
                <Frame label="4 : 3" />
              </AspectRatio>
              <CardHeader>
                <CardTitle>Value, 2019–2026</CardTitle>
                <CardDescription>Weekly, log scale</CardDescription>
              </CardHeader>
            </Card>
          </Grid>
        ),
      },
      {
        title: "A gallery",
        note: "In a grid the ratio is what makes the rows line up: every thumbnail is the same shape before any of them has loaded, so the gallery has no reflow and no jump.",
        code: `<Grid columns={3} gap="md">
  <Stack gap="xs">
    <AspectRatio ratio="photo">…</AspectRatio>
    <Text variant="caption" tone="muted">Chart</Text>
  </Stack>
</Grid>`,
        node: (
          <Grid columns={3} gap="md">
            {["Chart", "Report", "Study", "Screen", "Note", "Export"].map((label) => (
              <Stack key={label} gap="xs">
                <AspectRatio ratio="photo" className="rounded-lg border border-line-subtle">
                  <Frame label="4 : 3" />
                </AspectRatio>
                <Text variant="caption" tone="muted">
                  {label}
                </Text>
              </Stack>
            ))}
          </Grid>
        ),
      },
      {
        title: "A numeric ratio",
        note: "The presets are a convenience rather than the API: any number works, which is how a chart that has to match a panel's proportions is kept exact.",
        code: `<AspectRatio ratio={2.35}>…</AspectRatio>`,
        node: (
          <AspectRatio ratio={2.35} className="rounded-lg border border-line-subtle">
            <Frame label="2.35 : 1" />
          </AspectRatio>
        ),
      },
    ],
  }),
];

export const layoutDemos: readonly DemoSpec[] = layoutDemoSpecs.map((spec) =>
  spec.examples === undefined
    ? spec
    : {
        ...spec,
        examples: spec.examples.map((example) => ({ layout: "block" as const, ...example })),
      },
);
