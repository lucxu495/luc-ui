import { ChartRenderer, ChartSpec } from "../types.js";
//#region src/charts/core/static-capture.d.ts
/** The animation preset a capture uses: none. */
export declare const CHART_STATIC_ANIMATION: "none";
/** The drawing layer a capture asks for. */
export declare const CHART_STATIC_RENDERER: ChartRenderer;
/**
 * The three properties a capture needs, as data.
 *
 * A host that cannot use `staticChartSpec` — because it drives a family
 * component directly, or builds its own props — can read them from here rather
 * than restating them. Everything in this object is a public prop with a
 * default; nothing is a new concept.
 */
export declare const CHART_STATIC_CAPTURE: {
  readonly animation: "none";
  readonly renderer: "svg";
  readonly eager: true;
};
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
export declare function staticChartSpec<TRow extends object>(spec: ChartSpec<TRow>, options?: {
  renderer?: ChartRenderer;
}): ChartSpec<TRow>;
//#endregion
//# sourceMappingURL=static-capture.d.ts.map