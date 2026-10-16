//#region src/charts/core/static-capture.ts
/** The animation preset a capture uses: none. */
const CHART_STATIC_ANIMATION = "none";
/** The drawing layer a capture asks for. */
const CHART_STATIC_RENDERER = "svg";
/**
* The three properties a capture needs, as data.
*
* A host that cannot use `staticChartSpec` — because it drives a family
* component directly, or builds its own props — can read them from here rather
* than restating them. Everything in this object is a public prop with a
* default; nothing is a new concept.
*/
const CHART_STATIC_CAPTURE = {
	animation: CHART_STATIC_ANIMATION,
	renderer: "svg",
	eager: true
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
function staticChartSpec(spec, options = {}) {
	return {
		...spec,
		animation: CHART_STATIC_ANIMATION,
		renderer: options.renderer ?? "svg"
	};
}
//#endregion
export { CHART_STATIC_ANIMATION, CHART_STATIC_CAPTURE, CHART_STATIC_RENDERER, staticChartSpec };

//# sourceMappingURL=static-capture.js.map