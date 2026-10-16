/*
 * Live Demos — Typography.
 *
 * `typography` (Heading, Text, NumericText, Code, Kbd).
 */

import { Code, Heading, Inline, Kbd, NumericText, Stack, Text } from "@luc/ui";
import { composition, type DemoSpec } from "../index";

/*
 * Typography is one page for five components, so the specimen is a short,
 * complete piece of set text rather than five isolated tags — the point of the
 * family is how the sizes and tones sit against each other.
 */
export const typographyDemos: readonly DemoSpec[] = [
  composition({
    id: "typography",
    node: (
      <Stack gap="sm">
        <Heading size="title" as="h3">
          Portfolio review
        </Heading>
        <Text variant="body">Three positions were rebalanced this morning.</Text>
        <NumericText value={1284.5} kind="decimal" signed />
        <Inline gap="xs" align="center">
          <Code>pnpm build</Code>
          <Kbd>⌘</Kbd>
        </Inline>
      </Stack>
    ),
    note: "One paragraph set in the four voices: heading, body, numeric and code.",
    code: `<Stack gap="sm">
  <Heading size="title" as="h3">Portfolio review</Heading>
  <Text variant="body">Three positions were rebalanced this morning.</Text>
  <NumericText value={1284.5} kind="decimal" signed />
  <Inline gap="xs" align="center">
    <Code>pnpm build</Code>
    <Kbd>⌘</Kbd>
  </Inline>
</Stack>`,
  }),
];
