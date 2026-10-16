"use client";

/*
 * KineticHeadline — typography that acknowledges a change.
 *
 * The only way to see what this component does is to *change the text*, so the
 * text is the first control and the stage is a single headline. `mode` picks how
 * the words arrive (`reveal` assembles, `swap` replaces in place) and `stagger`
 * sets the rhythm between them.
 *
 * The headline string is a required prop, so it is declared as a control with
 * the sample copy as its default — which means the engine omits it from the
 * generated element until the reader edits it. The panel's AI prompt still
 * carries the chosen text, and the page's Usage section shows the complete
 * element; see the adapter report for why the snippet behaves this way.
 */

import { KineticHeadline, type KineticHeadlineTag } from "@luc/ui/motion";
import { serializeProps } from "../engine";
import type { ControlValues, PlaygroundSpec } from "../types";

type KineticHeadlineMode = "reveal" | "swap";

const MODES = ["reveal", "swap"] as const;
const TAGS = ["h1", "h2", "h3", "p", "span", "div"] as const;

export const kineticHeadlinePlayground: PlaygroundSpec = {
  id: "kinetic-headline",
  component: "KineticHeadline",
  importPath: "@luc/ui/motion",
  stageNote: "Edit the headline: the words re-enter with the mode and the stagger you chose.",
  presetSource: "mode",
  controls: [
    {
      kind: "text",
      name: "text",
      label: "Headline",
      default: "Markets reprice in seconds",
      help: "The component animates a change to this string — it is the headline's only content.",
      /* Without it the element renders nothing, so it is not a preference. */
      required: true,
    },
    {
      kind: "enum",
      name: "mode",
      label: "Mode",
      default: "reveal",
      options: MODES.map((value) => ({ value })),
      help: "`reveal` assembles the words; `swap` replaces the line in place.",
    },
    {
      kind: "number",
      name: "stagger",
      label: "Stagger",
      default: 0.045,
      min: 0.01,
      max: 0.12,
      step: 0.005,
      unit: "s",
      group: "advanced",
      help: "Seconds between consecutive words.",
    },
    {
      kind: "enum",
      name: "as",
      label: "Element",
      default: "h2",
      group: "advanced",
      options: TAGS.map((value) => ({ value })),
      help: "The caller owns the type scale, so the tag is a choice rather than a default.",
    },
    {
      kind: "boolean",
      name: "live",
      label: "Live region",
      default: false,
      group: "advanced",
      help: "Announce the new text politely when it changes, for a status line rather than a headline.",
    },
  ],
  unsupported: [
    {
      name: "className",
      reason: "Type scale and layout belong to the page that places the headline.",
    },
    {
      name: "style",
      reason: "Colour and spacing come from the type tokens; an inline style would override the system.",
    },
  ],
  render: (values: ControlValues) => (
    <KineticHeadline
      text={String(values.text)}
      mode={String(values.mode) as KineticHeadlineMode}
      stagger={typeof values.stagger === "number" ? values.stagger : 0.045}
      as={String(values.as) as KineticHeadlineTag}
      live={values.live === true}
    />
  ),
  serialize: (values: ControlValues) =>
    `<KineticHeadline${serializeProps(kineticHeadlinePlayground, values)} />`,
};
