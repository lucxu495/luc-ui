/*
 * Real, server-rendered examples for the entries that can honestly have one.
 *
 * The rule this file exists to enforce: an example is written by hand, renders
 * the real component from `@luc/ui`, and is small enough that the code shown
 * beside it is exactly the code that produced it. A component with no entry
 * here gets no demo and says so — a page with a fabricated or empty "preview"
 * teaches a developer less than a page that admits it has no example.
 *
 * Why a map of nodes rather than a per-page component: the pages are generated,
 * so the example has to be data. Why server-rendered nodes and not a client
 * island: a specimen of `Separator` or `Delta` needs no state, and shipping a
 * client bundle to draw one would be the wrong trade. Components that are
 * themselves client components (Progress, Rating, Switch, Textarea) render
 * fine as children of a server component; only the interactive *state* would
 * need a client island, and none of these examples has any.
 */

import {
  Code,
  Container,
  Delta,
  Heading,
  Inline,
  Kbd,
  Link,
  NumericText,
  Panel,
  Progress,
  Rating,
  Separator,
  Skeleton,
  Spinner,
  Stack,
  StatCard,
  Switch,
  Textarea,
  Text,
} from "@luc/ui";
import type { ReactNode } from "react";

export interface DocExample {
  /** The JSX that produced `node`, shown beside it and copyable. */
  code: string;
  /**
   * The live specimen, rendered on the server.
   *
   * A function when the specimen contains a link: the href in `code` stays the
   * plain one a reader would copy, while the anchor that is actually rendered
   * has to carry the locale prefix or a Chinese page hands out an English URL
   * (`qa/locale.mjs`).
   */
  node: ReactNode | ((href: (target: string) => string) => ReactNode);
}

const examples: Record<string, DocExample> = {
  typography: {
    code: `<Heading size="title" as="h3">Portfolio review</Heading>
<Text variant="body">Three positions were rebalanced this morning.</Text>
<NumericText value={1284.5} kind="decimal" signed />
<Code>npm run build</Code>
<Kbd>⌘</Kbd>`,
    node: (
      <Stack gap="sm">
        <Heading size="title" as="h3">
          Portfolio review
        </Heading>
        <Text variant="body">Three positions were rebalanced this morning.</Text>
        <NumericText value={1284.5} kind="decimal" signed />
        <Inline gap="xs" align="center">
          <Code>npm run build</Code>
          <Kbd>⌘</Kbd>
        </Inline>
      </Stack>
    ),
  },
  container: {
    code: `<Container>
  <Text variant="body">Content is centred and padded by the container.</Text>
</Container>`,
    node: (
      <Container className="rounded-lg border border-dashed border-line-strong py-4">
        <Text variant="body">Content is centred and padded by the container.</Text>
      </Container>
    ),
  },
  inline: {
    code: `<Inline gap="sm" align="center" wrap>
  <Delta value={2.4} />
  <Delta value={-1.1} />
  <Delta value={0} />
</Inline>`,
    node: (
      <Inline gap="sm" align="center" wrap>
        <Delta value={2.4} />
        <Delta value={-1.1} />
        <Delta value={0} />
      </Inline>
    ),
  },
  stack: {
    code: `<Stack gap="xs">
  <Text variant="caption">Lookback</Text>
  <Text variant="body">200 weeks</Text>
</Stack>`,
    node: (
      <Stack gap="xs">
        <Text variant="caption">Lookback</Text>
        <Text variant="body">200 weeks</Text>
      </Stack>
    ),
  },
  panel: {
    code: `<Panel className="p-4">
  <Text variant="body">A surface that groups related content.</Text>
</Panel>`,
    node: (
      <Panel className="p-4">
        <Text variant="body">A surface that groups related content.</Text>
      </Panel>
    ),
  },
  separator: {
    code: `<Stack gap="md">
  <Text variant="body">Above the rule</Text>
  <Separator />
  <Text variant="body">Below the rule</Text>
</Stack>`,
    node: (
      <Stack gap="md">
        <Text variant="body">Above the rule</Text>
        <Separator />
        <Text variant="body">Below the rule</Text>
      </Stack>
    ),
  },
  delta: {
    code: `<Inline gap="md" align="center">
  <Delta value={4.8} />
  <Delta value={-2.35} />
  <Delta value={0.004} />
</Inline>`,
    node: (
      <Inline gap="md" align="center">
        <Delta value={4.8} />
        <Delta value={-2.35} />
        <Delta value={0.004} />
      </Inline>
    ),
  },
  "stat-card": {
    code: `<StatCard label="Rows loaded" value={18432} />`,
    node: <StatCard label="Rows loaded" value={18432} />,
  },
  progress: {
    code: `<Progress value={62} aria-label="Share of tasks done" />`,
    node: <Progress value={62} aria-label="Share of tasks done" />,
  },
  spinner: {
    code: `<Spinner size={16} />`,
    node: <Spinner size={16} />,
  },
  skeleton: {
    code: `<Skeleton className="h-12 w-full" />`,
    node: <Skeleton className="h-12 w-full" />,
  },
  rating: {
    code: `<Rating value={4.5} readOnly allowHalf size="sm" label="Average rating" />`,
    node: <Rating value={4.5} readOnly allowHalf size="sm" label="Average rating" />,
  },
  switch: {
    code: `<Switch defaultChecked aria-label="Auto-apply patches" />`,
    node: <Switch defaultChecked aria-label="Auto-apply patches" />,
  },
  textarea: {
    code: `<Textarea rows={3} placeholder="Notes for this run" />`,
    node: <Textarea rows={3} placeholder="Notes for this run" />,
  },
  link: {
    code: `<Link href="/components">Browse the component catalogue</Link>`,
    node: (href) => <Link href={href("/components")}>Browse the component catalogue</Link>,
  },
};

export function exampleFor(id: string): DocExample | undefined {
  return examples[id];
}

/** The ids with a real example, for the coverage note in the audit report. */
export const exampleIds: readonly string[] = Object.keys(examples).sort();
