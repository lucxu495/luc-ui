//#region src/charts/adapters/lightweight/range-application.ts
function visibleRangeKey(range) {
	if (range === void 0) return "uncontrolled";
	if (range === null) return "all";
	return `${range.fromMs}:${range.toMs}`;
}
/**
* Decide whether a render may move the time scale.
*
* Initial mount always gets one explicit frame. Afterwards `undefined` means
* the caller owns the viewport, so data/theme/pane rebuilds preserve it. A
* controlled value moves it only when its value changes; `null` is an explicit
* "fit all", not an absent prop.
*/
function resolveVisibleRangeAction(range, previousKey, initialised) {
	if (!initialised) return range ? {
		kind: "set",
		fromMs: range.fromMs,
		toMs: range.toMs
	} : { kind: "fit" };
	if (visibleRangeKey(range) === previousKey) return { kind: "preserve" };
	if (range === void 0) return { kind: "preserve" };
	if (range === null) return { kind: "fit" };
	return {
		kind: "set",
		fromMs: range.fromMs,
		toMs: range.toMs
	};
}
//#endregion
export { resolveVisibleRangeAction, visibleRangeKey };

//# sourceMappingURL=range-application.js.map