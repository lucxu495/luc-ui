/**
 * Direct axis manipulation: which band the pointer is in, and what a drag on it
 * means.
 *
 * TradingView-style inspection lets the reader grab an *axis* rather than the
 * plot: dragging the time axis compresses or expands the visible time span,
 * dragging the price axis compresses or expands the visible value range. The
 * two are different in kind, and keeping them apart is the whole point:
 *
 *   time axis  → the visible window changes → a **reader range gesture**
 *   value axis → the visible value range changes → **local** to this plate
 *
 * This module is pure geometry and arithmetic so both engines can share one
 * definition of "a drag on an axis" and so the semantics can be asserted without
 * a browser. ECharts has no native equivalent, so its surface drives these
 * functions from pointer events; Lightweight Charts implements both drags
 * natively (`handleScale.axisPressedMouseMove`) and only relies on the band model
 * for its double-click reset.
 */

export type AxisBand = "time" | "value" | null;

/** How wide the axis bands are, in CSS pixels, when the engine does not say. */
export const AXIS_BAND_PX = 34;

export interface PlotRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A grid value: pixels as a number, or a percentage string of the host box. */
function toPixels(value: unknown, extent: number, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().endsWith("%")) {
    const percent = Number.parseFloat(value);
    if (Number.isFinite(percent)) return (extent * percent) / 100;
  }
  return fallback;
}

/**
 * The plot rectangle inside a host box, from an ECharts `grid` descriptor.
 *
 * The engine reports the grid as `left`/`right`/`top`/`bottom` distances, in
 * pixels or percentages, so the rectangle the *reader* sees is the host box
 * minus those four distances. Percentages are resolved against the host box
 * because that is what the engine itself does.
 */
export function plotRect(
  grid: { left?: unknown; right?: unknown; top?: unknown; bottom?: unknown } | null | undefined,
  size: { width: number; height: number },
): PlotRect {
  const left = toPixels(grid?.left, size.width, 0);
  const right = size.width - toPixels(grid?.right, size.width, 0);
  const top = toPixels(grid?.top, size.height, 0);
  const bottom = size.height - toPixels(grid?.bottom, size.height, 0);
  return {
    left,
    right: Math.max(left, right),
    top,
    bottom: Math.max(top, bottom),
  };
}

/**
 * Which axis the pointer is on, if any.
 *
 * The bands are the strips *outside* the plot rectangle: the time axis along the
 * bottom, the value axis along whichever side carries it. `side` matters because
 * a chart may place its price scale on the left.
 */
export function axisBandAt(
  point: { x: number; y: number },
  rect: PlotRect,
  size: { width: number; height: number },
  options: { side?: "left" | "right"; band?: number } = {},
): AxisBand {
  const band = options.band ?? AXIS_BAND_PX;
  const side = options.side ?? "right";
  const inValueBand =
    side === "right"
      ? point.x > rect.right && point.y <= rect.bottom + 2
      : point.x < rect.left && point.y <= rect.bottom + 2;
  if (inValueBand && point.y >= rect.top - band && point.y <= size.height) return "value";
  const inTimeBand = point.y > rect.bottom && point.x >= rect.left - band && point.x <= rect.right + 2;
  if (inTimeBand && point.x <= size.width) return "time";
  return null;
}

export interface Window {
  start: number;
  end: number;
}

/**
 * Scale a window around the pointer, in the engine's own percent space.
 *
 * `pointerFraction` is where along the plot the drag started (0 = left edge of
 * the plot, 1 = right edge), and `anchorFraction` is the same point expressed in
 * *window* space. The window stays anchored there while its span is multiplied
 * by `1 / (1 + pixels / plotSize)`: dragging right (positive pixels) shrinks the
 * span — the same direction Lightweight Charts' time-axis drag uses — and
 * dragging left expands it.
 *
 * The result is clamped into `[0, 100]` and to a minimum span, so a drag can
 * never invert or collapse the window.
 */
export function scaleWindow(
  from: Window,
  anchor: number,
  pixels: number,
  plotSize: number,
  options: { minSpan?: number; bounds?: Window } = {},
): Window {
  const bounds = options.bounds ?? { start: 0, end: 100 };
  const minSpan = options.minSpan ?? 0.5;
  const span = from.end - from.start;
  if (!(plotSize > 0) || !(span > 0)) return { ...from };
  const factor = 1 / (1 + pixels / plotSize);
  const anchored = Math.min(Math.max(anchor, from.start), from.end);
  const wantedSpan = Math.min(Math.max(span * factor, Math.min(minSpan, span)), bounds.end - bounds.start);
  const start = anchored - (anchored - from.start) * (wantedSpan / span);
  const clampedStart = Math.min(Math.max(start, bounds.start), bounds.end - wantedSpan);
  return { start: clampedStart, end: clampedStart + wantedSpan };
}

/** Where a pointer pixel sits: as a fraction of the plot, and inside the window. */
export function windowFractions(
  from: Window,
  pointerPixels: number,
  rect: { from: number; to: number },
): { plotFraction: number; anchor: number } {
  const size = rect.to - rect.from;
  const plotFraction = size > 0 ? Math.min(Math.max((pointerPixels - rect.from) / size, 0), 1) : 0.5;
  return { plotFraction, anchor: from.start + (from.end - from.start) * plotFraction };
}

/**
 * Scale a value range around a pointer value.
 *
 * Same shape as `scaleWindow` but for the value axis: `pixels` is the vertical
 * drag, and the range keeps its anchor value under the pointer. The floor is a
 * fraction of the original span rather than an absolute number, because "how
 * tight can this axis get" depends on the metric's units.
 */
export function scaleValueRange(
  range: { min: number; max: number },
  anchorValue: number,
  pixels: number,
  plotSize: number,
  options: { minSpanRatio?: number } = {},
): { min: number; max: number } {
  const span = range.max - range.min;
  if (!(plotSize > 0) || !(span > 0) || !Number.isFinite(anchorValue)) return { ...range };
  const minSpan = span * (options.minSpanRatio ?? 0.02);
  const factor = 1 / (1 + pixels / plotSize);
  const anchored = Math.min(Math.max(anchorValue, range.min), range.max);
  const wanted = Math.max(span * factor, minSpan);
  return {
    min: anchored - (anchored - range.min) * (wanted / span),
    max: anchored + (range.max - anchored) * (wanted / span),
  };
}
