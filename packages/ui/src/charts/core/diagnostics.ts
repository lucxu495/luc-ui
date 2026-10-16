/*
 * What the renderer actually drew — as measured geometry, not as an assumption.
 *
 * Why this exists
 * ---------------
 * A canvas chart is opaque to every DOM query. Phase 10A.1 began with a person
 * seeing eleven broken charts while five hundred screenshots passed, and the reason
 * the screenshots passed is that a screenshot proves a *page* loaded, not that a
 * chart is readable. For an SVG chart a test can walk the nodes; for a canvas chart
 * the axis labels, series labels and value labels are pixels, and "the labels
 * overlap" was therefore unmeasurable.
 *
 * This module makes it measurable. After the engine finishes a frame it publishes a
 * compact digest of the display list — how many marks of each kind were drawn, and
 * the screen-space box of every text item — on the host element as
 * `data-luc-chart-diagnostics`. QA reads that attribute and computes overlaps,
 * clipping and mark counts from real geometry.
 *
 * Deliberate limits:
 *
 *   - it is a **reading**, never an input: nothing in the library consumes it, so a
 *     wrong number cannot change what a chart draws;
 *   - it is capped (`MAX_TEXTS`) so a 5,000-point scatter cannot slow a frame;
 *   - it is defensive about the zrender API, because the engine is a peer
 *     dependency and its internals are not a contract we control. A missing method
 *     yields a smaller digest, never a thrown error.
 */

/** One text item, in CSS pixels relative to the chart's own box. */
export interface DiagnosticText {
  /** The rendered string, clipped to 48 characters so the attribute stays small. */
  t: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChartDiagnostics {
  /** Marks drawn by kind: `path`, `rect`, `circle`, `line`, … */
  marks: Record<string, number>;
  /** Total marks, for a quick "did the series render at all" reading. */
  m: number;
  /** Text items the engine drew, in draw order. */
  texts: DiagnosticText[];
  /** How many text items were dropped by the cap. */
  dropped: number;
  /** Device pixel ratio the frame was drawn at. */
  dpr: number;
}

/** Upper bound on published text items. A frame with more than this is a table. */
export const MAX_DIAGNOSTIC_TEXTS = 400;

interface Transformable {
  getBoundingRect?: () => { x: number; y: number; width: number; height: number };
  getComputedTransform?: () => number[] | null;
  transform?: number[] | null;
  type?: string;
  style?: { text?: string };
  shape?: { width?: number; height?: number };
}

/**
 * Read one frame's geometry out of the engine.
 *
 * `scale` converts the display list's device pixels back to CSS pixels; the caller
 * passes the painter's ratio. Values are rounded to a tenth of a pixel, which is
 * finer than any layout decision and keeps the attribute compact.
 */
interface ZRenderLike {
  painter?: { getDpr?: () => number };
  storage?: {
    getDisplayList?: (params?: object, includeIgnore?: boolean) => Transformable[];
  };
}

export function collectChartDiagnostics(chart: unknown): ChartDiagnostics | null {
  /*
   * One widening, at the boundary. zrender's internals are not a contract we own —
   * it is a peer dependency that ships its own types — so the digest reads the two
   * members it needs through a narrow structural type and treats anything missing
   * as "no diagnostics" rather than as an error.
   */
  const zr = (chart as { getZr?: () => ZRenderLike | undefined } | null)?.getZr?.();
  const displayList = zr?.storage?.getDisplayList?.(undefined, false);
  if (!displayList) return null;
  const dpr = zr?.painter?.getDpr?.() ?? 1;
  const marks: Record<string, number> = {};
  /*
   * zrender draws a label as a `tspan` inside a `text` container, and only one of
   * the two carries the box that matches what is on screen. The engine's canvas
   * painter emits `tspan`; a vector painter emits `text`. Both are collected, and
   * whichever kind is present wins, so a label is counted once either way.
   */
  const spans: DiagnosticText[] = [];
  const containers: DiagnosticText[] = [];
  let dropped = 0;

  const round = (value: number) => Math.round(value * 10) / 10;

  for (const item of displayList) {
    const type = item?.type ?? "unknown";
    marks[type] = (marks[type] ?? 0) + 1;
    if (type !== "text" && type !== "tspan") continue;
    const rect = item.getBoundingRect?.();
    if (!rect) continue;
    const transform = item.getComputedTransform?.() ?? item.transform ?? null;
    const [ta, tb, tc, td, te, tf] = transform ?? [];
    /*
     * A rotated or scaled label must be measured where it is drawn, so the four
     * corners of the local rect are transformed and re-boxed, rather than trusting
     * `x`/`y` — the sunburst report is precisely about rotated labels colliding.
     */
    const corners: Array<[number, number]> = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x, rect.y + rect.height],
      [rect.x + rect.width, rect.y + rect.height],
    ];
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const [px, py] of corners) {
      const x = transform ? (ta ?? 1) * px + (tc ?? 0) * py + (te ?? 0) : px;
      const y = transform ? (tb ?? 0) * px + (td ?? 1) * py + (tf ?? 0) : py;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const bucket = type === "tspan" ? spans : containers;
    if (bucket.length >= MAX_DIAGNOSTIC_TEXTS) {
      dropped += 1;
      continue;
    }
    bucket.push({
      t: (item.style?.text ?? "").slice(0, 48),
      x: round(minX / dpr),
      y: round(minY / dpr),
      w: round((maxX - minX) / dpr),
      h: round((maxY - minY) / dpr),
    });
  }

  const chosen = spans.length > 0 ? spans : containers;
  const total = Object.values(marks).reduce((sum, count) => sum + count, 0);
  return { marks, m: total, texts: chosen, dropped, dpr };
}

/**
 * The digest as it is published: one JSON string, and `null` when the engine has
 * not finished a frame yet (which is a fact QA needs to be able to see).
 */
export function serializeDiagnostics(diagnostics: ChartDiagnostics | null): string | null {
  return diagnostics ? JSON.stringify(diagnostics) : null;
}
