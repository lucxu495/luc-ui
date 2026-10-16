/*
 * The Live Demo contract.
 *
 * A documentation page has three levels of help it can give, and Phase 9
 * reported the last two while quietly skipping the first:
 *
 *   Live Demo              the real component, on the page, with a real fixture
 *   Interactive Playground the same component with the reader driving its props
 *   Studio                 a domain editor that is more than a prop panel
 *
 * This module is the first level. The distinction matters because a page that
 * shows an API table and no specimen is a type-definition browser, not a
 * component library's documentation — and a page that renders a grey rectangle
 * titled "preview" is worse, because it teaches the reader to distrust the page.
 *
 * Two rules follow, and they are what make ~200 demos maintainable:
 *
 *  1. A demo is **data**: an id, a node, the code, and how the specimen needs
 *     to be staged. One page component renders all of them, so a new demo is a
 *     registry entry rather than another copy of a preview shell.
 *  2. A demo renders a **real public component with a deterministic fixture**.
 *     No screenshot, no CSS mock, no placeholder. `origin` records whether the
 *     snippet was generated from the very props object the node was built from
 *     (`structured`) or written by hand for a composition the printer cannot
 *     express (`composition`) — the second is allowed, but it is visible.
 */

import type { ReactNode } from "react";

/**
 * How the stage lays the specimen out.
 *
 * `inline` is a row of small specimens, `block` a column, `grid` a set of
 * equally weighted cards and `stage` a full-width surface for anything that
 * needs room to be readable — a chart, a board, a shell.
 */
export type DemoLayout = "inline" | "block" | "grid" | "stage";

/**
 * A second, named configuration of the same specimen.
 *
 * MOT-002. A motion primitive's page used to show one specimen and then a page
 * of prose, which answers "what is this" but not "what can it do" — and the
 * answer to the second question is a *picture*, not another paragraph. An
 * example is a sibling of the page's own demo: its own live node, its own
 * copyable snippet, and a name that says which configuration it is.
 *
 * Deliberately not a `DemoSpec`: an example has no id (it is not addressable on
 * its own), no `origin` (it inherits the page's) and no `source` (nothing reads
 * one). It is the part of a demo that a reader looks at.
 */
export interface DemoExample {
  /** What this configuration is, in a phrase: "Two cards, wide stage". */
  title: string;
  /** The live specimen. */
  node: ReactNode;
  /** The JSX that reproduces `node`. */
  code: string;
  /** One sentence about what to notice. */
  note?: string;
  /**
   * How this configuration sits in its stage.
   *
   * The page's own specimen already declares one (`DemoSpec.layout`); an
   * example did not, so every configuration was framed as a centred row of
   * small specimens. That is right for a control and wrong for a layout
   * primitive: a `Grid`, a `Stack` or a `Guide` in an `inline` stage is a flex
   * item sized to its own content, so a three-column grid rendered 278 px wide
   * and centred instead of showing what the column count does with the width it
   * is given. Omitted, the frame keeps the behaviour it has always had.
   */
  layout?: DemoLayout;
}

export interface DemoSpec {
  /** Matches `DocEntry.id`. */
  id: string;
  /**
   * What this specimen shows, in a phrase: "Variants", "Three sizes".
   *
   * The page's own specimen and its other configurations are one list of
   * capabilities on a component page (`docs/COMPONENTS_V2.md` §6), so the first
   * one needs a name for the same reason the others do. Named after the
   * *capability* rather than the prop, like every other example title.
   *
   * Optional because the demo registries are 200-odd modules deep and the chart
   * and motion shapes have no such heading; a page that omits it gets the
   * honest generic "Default".
   */
  title?: string;
  /** The live specimen: the real component, with a deterministic fixture. */
  node: ReactNode;
  /** The JSX a reader copies to reproduce `node`. */
  code: string;
  /**
   * `structured` — `code` was printed from the same props object `node` used.
   * `composition` — the specimen is assembled from several components and the
   * snippet was written by hand because the printer cannot express it.
   */
  origin: "structured" | "composition";
  /**
   * A `structured` demo's source: the exported component's name and the fixture
   * props the specimen was rendered from.
   *
   * The chart Playground reads this so a chart page can offer a control panel
   * built from the *same* fixture the page is already showing, instead of a
   * second copy of the data that could disagree with it.
   */
  source?: { component: string; props: Record<string, unknown> };
  /** One sentence about what the fixture shows. Rendered above the stage. */
  note?: string;
  layout?: DemoLayout;
  /**
   * Minimum height of the stage in pixels, for specimens that measure their
   * container (charts) or have a layout of their own (a shell, a board).
   */
  height?: number;
  /** Render the specimen without the demo frame's own surface. */
  bare?: boolean;
  /**
   * Other configurations of the same component, shown after the main specimen.
   *
   * Two to four is the useful range: one is the page's own demo, and eight turns
   * a page into a catalogue. Each one is a real configuration of the real
   * component — never a second copy of the same animation.
   */
  examples?: readonly DemoExample[];
}
