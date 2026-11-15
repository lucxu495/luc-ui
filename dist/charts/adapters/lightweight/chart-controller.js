import { toChartTime } from "./runtime.js";
//#region src/charts/adapters/lightweight/chart-controller.ts
function seriesDefinitions(module) {
	return {
		candlestick: module.CandlestickSeries,
		line: module.LineSeries,
		area: module.AreaSeries,
		histogram: module.HistogramSeries,
		baseline: module.BaselineSeries,
		bar: module.BarSeries
	};
}
function restoreViewport(chart, range) {
	if (!range) return;
	try {
		chart.timeScale().setVisibleRange(range);
	} catch {}
}
function createLightweightController(chart, module, theme) {
	const bindings = /* @__PURE__ */ new Map();
	const definitions = seriesDefinitions(module);
	const requireSeries = (id) => {
		const binding = bindings.get(id);
		if (!binding) throw new Error(`[luc-ui] Unknown Lightweight Charts series "${id}"`);
		return binding;
	};
	return {
		controller: {
			chart,
			module,
			theme,
			upsertSeries(id, kind, options, data, paneIndex = 0) {
				let binding = bindings.get(id);
				if (binding && (binding.kind !== kind || binding.paneIndex !== paneIndex)) {
					const visibleRange = chart.timeScale().getVisibleRange();
					chart.removeSeries(binding.series);
					bindings.delete(id);
					binding = void 0;
					const series = chart.addSeries(definitions[kind], options, paneIndex);
					series.setData(data);
					bindings.set(id, {
						kind,
						series,
						paneIndex,
						data
					});
					restoreViewport(chart, visibleRange);
					return series;
				}
				if (!binding) {
					const series = chart.addSeries(definitions[kind], options, paneIndex);
					series.setData(data);
					bindings.set(id, {
						kind,
						series,
						paneIndex,
						data
					});
					return series;
				}
				binding.series.applyOptions(options);
				if (binding.data !== data) {
					binding.series.setData(data);
					binding.data = data;
				}
				return binding.series;
			},
			setSeriesData(id, data) {
				const binding = requireSeries(id);
				binding.series.setData(data);
				binding.data = data;
				return binding.series;
			},
			updateSeries(id, item) {
				const { series } = requireSeries(id);
				series.update(item);
				return series;
			},
			getSeries(id) {
				return bindings.get(id)?.series ?? null;
			},
			removeSeries(id) {
				const binding = bindings.get(id);
				if (!binding) return;
				chart.removeSeries(binding.series);
				bindings.delete(id);
			},
			fit() {
				chart.timeScale().fitContent();
			},
			setVisibleRange(fromMs, toMs) {
				chart.timeScale().setVisibleRange({
					from: toChartTime(fromMs),
					to: toChartTime(toMs)
				});
			}
		},
		bindings
	};
}
//#endregion
export { createLightweightController };

//# sourceMappingURL=chart-controller.js.map