/*
 * Motion — typography.
 *
 * `TextReveal` assembles words; `ScrambleText` resolves characters in place.
 * Both are shown with their own words, because what a type animation does to
 * *length* is half of whether it is usable.
 */

import { ScrambleText, TextReveal, type ScrambleTextProps } from "@luc/ui/motion";
import { Stack } from "@luc/ui";
import { demo, type DemoSpec } from "../index";

export const motionTypographyDemos: readonly DemoSpec[] = [
  demo<ScrambleTextProps>({
    id: "text-reveal",
    component: "ScrambleText",
    props: { text: "Markets reprice in seconds", duration: 0.9 },
    render: (props) => (
      <Stack gap="md">
        <TextReveal text="Markets reprice in seconds" mode="word" className="text-heading-sm font-semibold" />
        <ScrambleText {...props} className="text-body text-fg-muted" />
      </Stack>
    ),
    layout: "block",
    note: "Both modes reduce to an instant swap under `prefers-reduced-motion`; the text never ends up half-drawn.",
  }),
];
