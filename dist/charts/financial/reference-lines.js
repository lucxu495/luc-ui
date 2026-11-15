//#region src/charts/financial/reference-lines.ts
/**
* Owns one price-line object per logical series and level.
*
* Theme changes update the existing object. Level changes remove only the
* lines that disappeared and create only the ones that appeared. A replaced or
* removed series explicitly forgets/disposes its association, so a later data
* update cannot mutate a line owned by a removed engine series.
*/
var IndicatorReferenceLines = class {
	bySeries = /* @__PURE__ */ new Map();
	sync(seriesKey, series, levels, color) {
		let lines = this.bySeries.get(seriesKey);
		if (!lines) {
			lines = /* @__PURE__ */ new Map();
			this.bySeries.set(seriesKey, lines);
		}
		const desired = new Set(levels);
		for (const [level, line] of lines) {
			if (desired.has(level)) continue;
			series.removePriceLine(line);
			lines.delete(level);
		}
		levels.forEach((level, index) => {
			const options = {
				price: level,
				color,
				lineWidth: 1,
				lineStyle: 1,
				axisLabelVisible: index === 0,
				title: ""
			};
			const line = lines.get(level);
			if (line) line.applyOptions(options);
			else lines.set(level, series.createPriceLine(options));
		});
	}
	/** The engine already removed the series; discard stale object handles. */
	forget(seriesKey) {
		this.bySeries.delete(seriesKey);
	}
	/** Remove every line while its series is still alive. */
	dispose(seriesKey, series) {
		const lines = this.bySeries.get(seriesKey);
		if (!lines) return;
		for (const line of lines.values()) series.removePriceLine(line);
		this.bySeries.delete(seriesKey);
	}
	size(seriesKey) {
		return this.bySeries.get(seriesKey)?.size ?? 0;
	}
};
//#endregion
export { IndicatorReferenceLines };

//# sourceMappingURL=reference-lines.js.map