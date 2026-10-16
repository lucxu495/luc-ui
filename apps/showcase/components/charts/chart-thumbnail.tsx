"use client";

/*
 * A chart, as a picture — the fix for a catalogue that listed names.
 *
 * The chart catalogue could tell a reader that `SankeyChart` exists and could
 * not show them a Sankey. Every row now carries the real thing, drawn by the
 * same component the page documents, from the same fixture the page uses
 * (`lib/demo/registry.charts.ts`): a thumbnail that came from somewhere else
 * would be a second, quieter catalogue that could disagree with the first.
 *
 * Four things make that affordable on one page, and all four are the reasons
 * this is a component rather than forty lines in the catalogue:
 *
 *  1. **Nothing is drawn until it is approached.** The chart surfaces defer
 *     their own engine until the plot is near the viewport (`useChartArm`), and
 *     that is the contract this leans on rather than a second gate of its own: a
 *     catalogue of 78 rows mounts 78 cheap placeholder boxes and constructs the
 *     engines of the handful the reader can actually see.
 *  2. **A capture-shaped render.** `animation: "none"` renders the final frame
 *     instead of an intro that is still arriving, and `renderer: "svg"` draws
 *     vector marks that stay crisp when the card is a third of a screen instead
 *     of a full one. Both are the library's own public props — see
 *     `CHART_STATIC_CAPTURE`, whose reasoning this follows without importing it,
 *     because the capture contract is for hosts that need `eager` too.
 *  3. **A height, not a stage.** Each thumbnail renders its chart at
 *     `CHART_THUMBNAIL_HEIGHT`. That is the prop every chart family in this
 *     library already takes for its own demo, so a thumbnail is the same
 *     drawing at the size a card wants — not a full workbench squeezed into a
 *     grid cell.
 *  4. **A composition is staged, not resized.** A few demo entries compose a
 *     surface (`SmallMultiples`, the geographic demos) and have no single height
 *     prop to turn. Those keep their author's staging and are cropped to the
 *     card, with the last few pixels faded rather than sliced, so the row reads
 *     as "there is more here" instead of as a rendering fault.
 *
 * The picture is decorative. It is `aria-hidden` and takes no pointer events:
 * the card's link carries the accessible name, and a thumbnail that swallowed
 * hover would put an ECharts tooltip inside a card the reader is trying to click.
 */

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { chartDemoFor } from "@/lib/demo/registry.charts";

/** The drawing height of a catalogue thumbnail, in pixels. */
export const CHART_THUMBNAIL_HEIGHT = 148;

/**
 * The bottom edge fades, for the entries that keep their own staging.
 *
 * A structured demo is rendered *at* the thumbnail height, so it is never cut
 * and never needs this. A composition has no height prop to turn, so the card
 * crops it — and a fade reads as "there is more here" where a slice reads as a
 * rendering fault. Applying it to everything would dim the axis labels of the
 * seventy-two rows that fit exactly.
 */
const CROP_FADE = "linear-gradient(to bottom, #000 calc(100% - 14px), transparent 100%)";

export interface ChartThumbnailProps {
  /** The demo id — the same id the chart's own page is routed and keyed by. */
  id: string;
}

export function ChartThumbnail({ id }: ChartThumbnailProps) {
  const spec = chartDemoFor(id);
  const cropped = spec?.origin === "composition";

  let specimen: ReactNode = null;
  if (spec !== undefined) {
    const node = spec.node;
    specimen =
      spec.origin === "structured" && isValidElement(node)
        ? cloneElement(node as ReactElement<Record<string, unknown>>, {
            height: CHART_THUMBNAIL_HEIGHT,
            animation: "none",
            renderer: "svg",
          })
        : node;
  }

  return (
    <div
      aria-hidden="true"
      /*
       * `inert` and not just `aria-hidden`.
       *
       * Two of the seventy-nine thumbnails — the two ECharts-GL surfaces,
       * `surface3-dchart` and `volatility-surface-chart` — put a focusable
       * element inside their own canvas host. `aria-hidden` says "a screen
       * reader may not describe this"; it does not say "the keyboard may not
       * land on it", and axe's `aria-hidden-focus` (serious) is exactly that
       * gap: an element hidden from assistive technology that a Tab key still
       * reaches. `inert` closes both halves at once, for the whole subtree, and
       * it holds for whatever the next GL chart renders rather than for the two
       * that were measured — which is the reason this is here and not a
       * `tabIndex={-1}` inside somebody else's renderer.
       */
      inert
      data-chart-thumbnail={id}
      className="pointer-events-none w-full select-none overflow-hidden bg-surface-canvas"
      style={{
        height: CHART_THUMBNAIL_HEIGHT,
        ...(cropped ? { maskImage: CROP_FADE, WebkitMaskImage: CROP_FADE } : {}),
      }}
    >
      {specimen}
    </div>
  );
}
