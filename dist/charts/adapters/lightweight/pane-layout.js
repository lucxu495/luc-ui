//#region src/charts/adapters/lightweight/pane-layout.ts
function positivePaneRequests(values) {
	return [...new Set(values.filter((value) => value !== void 0 && value > 0))].sort((left, right) => left - right);
}
/**
* Pack non-price panes without holes when volume or an indicator disappears.
*
* Consumer `paneIndex` values above zero are logical additional-lane numbers,
* not physical engine indices. This keeps an indicator immediately below price
* when volume is disabled and shifts it down by one when volume is enabled.
*/
function resolveFinancialPaneLayout(input) {
	let nextPane = 1;
	const volumePane = input.showVolume && input.hasVolume ? nextPane++ : null;
	const overlayPanes = /* @__PURE__ */ new Map();
	const priceSeriesPanes = /* @__PURE__ */ new Map();
	const paneStretches = /* @__PURE__ */ new Map();
	paneStretches.set(0, 3);
	if (volumePane !== null) paneStretches.set(volumePane, 1);
	for (const requested of positivePaneRequests(input.overlays.map((overlay) => overlay.paneIndex))) {
		overlayPanes.set(requested, nextPane);
		paneStretches.set(nextPane, 1);
		nextPane += 1;
	}
	for (const requested of positivePaneRequests(input.priceSeries.map((series) => series.paneIndex))) {
		priceSeriesPanes.set(requested, nextPane);
		paneStretches.set(nextPane, 1);
		nextPane += 1;
	}
	const indicatorStart = nextPane;
	input.indicators.forEach((indicator, offset) => {
		paneStretches.set(indicatorStart + offset, indicator.stretch ?? 1);
	});
	return {
		volumePane,
		indicatorStart,
		overlayPanes,
		priceSeriesPanes,
		paneStretches
	};
}
//#endregion
export { resolveFinancialPaneLayout };

//# sourceMappingURL=pane-layout.js.map