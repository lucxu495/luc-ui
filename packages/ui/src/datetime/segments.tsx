"use client";

import { DateSegment } from "react-aria-components";
import type { ComponentProps } from "react";
import { cn } from "../utils/cn";

/*
 * The shared date/time segment renderer.
 *
 * The one subtlety: literal separators ("/" ":" " AM") come from the runtime's
 * ICU data, and Node's ICU and the browser's disagree about the width of the
 * space before "AM" (U+202F vs U+0020). Left alone, that shows up as a React
 * hydration mismatch on every server-rendered date field. Normalising the
 * literal text makes the two agree, and changes nothing a user can perceive.
 */

export const segmentClass = cn(
  /*
   * `py-1` rather than `py-0.5`: a date segment ("yyyy", "mm", "AM") is a
   * target in its own right, and WCAG 2.2 asks for 24 × 24 CSS pixels. At
   * `py-0.5` the box is 22 px tall, which the scan measures as a 21 px safe
   * clickable diameter. The padding grows by two pixels in each direction; the
   * text inside does not move, and the smallest control that contains a segment
   * is 26 px tall, so there is room for it.
   */
  /*
   * `min-w-6 text-center` finishes the WCAG 2.2 work `py-1` started.
   *
   * The padding above fixed the *height*: 26 px is over the 24 px minimum. The
   * *width* was still the text plus 8 px, so a two-digit day in a field squeezed
   * by a date-range layout measured 16 px — a serious `target-size` finding at
   * 390 px, and one the Showcase's own mobile axe pass could not see because axe
   * does not evaluate that rule in a touch-emulated context (`hasTouch: true`).
   *
   * `min-w-6` is 24 px, so every segment is at least 24 × 26 whatever the
   * container does, and it cannot be flex-shrunk below the minimum either.
   * `text-center` keeps the digits optically centred in the wider box instead of
   * hanging them off the left padding. This is a small, uniform change to the
   * date/time field's horizontal rhythm — the one consumer-visible trade the rule
   * requires — and it is the smallest one that satisfies it without touching the
   * height, the type scale or the separator spacing.
   */
  "rounded-xs min-w-6 px-1 py-1 text-center text-label text-fg-primary outline-none luc-numeric luc-transition",
  "data-[placeholder]:text-fg-muted",
  "data-[type=literal]:px-0.5 data-[type=literal]:text-fg-muted",
  "data-[focused]:bg-accent-soft data-[focused]:text-fg-accent",
  "data-[disabled]:text-fg-disabled",
);

/** ICU whitespace that varies between runtimes, normalised to a plain space. */
function normalizeLiteral(text: string): string {
  return text.replace(/[\u00a0\u202f\u2009]/g, " ");
}

export function renderSegment(segment: ComponentProps<typeof DateSegment>["segment"]) {
  if (segment.type === "literal") {
    return (
      <span aria-hidden="true" className="px-0.5 text-fg-muted">
        {normalizeLiteral(segment.text)}
      </span>
    );
  }
  return <DateSegment segment={segment} className={segmentClass} />;
}
