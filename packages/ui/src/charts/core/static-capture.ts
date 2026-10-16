/**
 * The static-capture contract.
 *
 * A chart that is read on a screen and a chart that is *captured* — into a PNG
 * at some density, into a PDF page, into a slide — want three different things
 * from the same component, and all three are already public properties. What
 * was missing was a single place that names them, because a capture host that
 * gets one of them wrong produces a picture that looks plausible and is wrong:
 *
 *  1. **Animation.** An intro animation means the marks are still arriving when
 *     the shutter opens. `animation: "none"` renders the final frame
 *     immediately. (`prefers-reduced-motion: reduce` does the same thing, and a
 *     capture host should set it too — see `useChartMotion`; but a spec-level
 *     switch is the one that does not depend on the host's environment.)
 *  2. **Deferred mounting.** The surface deliberately waits for its box to be
 *     near the viewport before it constructs an engine (`useChartArm`), so
 *     twenty charts do not initialise in one commit. A capture pass has no
 *     viewport: a chart on page 7 is "off screen" for its whole life, and a
 *     deferred surface captures an empty box. `eager` is the switch, and this
 *     is the trap that costs an afternoon if nobody names it.
 *  3. **The drawing layer.** A raster canvas is captured at whatever resolution
 *     it was painted at. `renderer: "svg"` emits vector elements, so the same
 *     chart stays sharp at any output density and survives a PDF page intact.
 *
 * Nothing here requires a capture-specific dependency, and nothing here is
 * specific to any one host: these are three properties a caller sets. The
 * function exists so that "what does a capture need?" has one answer that is
 * typed, tested, and cannot drift from the defaults.
 */

import type { ChartRenderer, ChartSpec } from "../types";

/** The animation preset a capture uses: none. */
export const CHART_STATIC_ANIMATION = "none" as const;

/** The drawing layer a capture asks for. */
export const CHART_STATIC_RENDERER: ChartRenderer = "svg";

/**
 * The three properties a capture needs, as data.
 *
 * A host that cannot use `staticChartSpec` — because it drives a family
 * component directly, or builds its own props — can read them from here rather
 * than restating them. Everything in this object is a public prop with a
 * default; nothing is a new concept.
 */
export const CHART_STATIC_CAPTURE = {
  animation: CHART_STATIC_ANIMATION,
  renderer: CHART_STATIC_RENDERER,
  eager: true,
} as const;

/**
 * The spec a capture should render.
 *
 * Additive on purpose: it changes the three properties a capture owns and
 * touches nothing else. Titles, legends, units, series, axes and annotations
 * are the caller's, because a capture that quietly dropped the unit label or
 * the legend would produce a picture that is *prettier* and *less true* than
 * the chart on the page.
 *
 * `renderer` is overridable for one real case: a family that cannot paint
 * vectors. Pass `"canvas"` and the host is responsible for the density it
 * captures at.
 */
export function staticChartSpec<TRow extends object>(
  spec: ChartSpec<TRow>,
  options: { renderer?: ChartRenderer } = {},
): ChartSpec<TRow> {
  return {
    ...spec,
    animation: CHART_STATIC_ANIMATION,
    renderer: options.renderer ?? CHART_STATIC_RENDERER,
  };
}
