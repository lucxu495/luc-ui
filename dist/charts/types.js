//#region src/charts/types.ts
/** Identity helper that preserves literal types for config-driven charts. */
function defineChartSpec(spec) {
	return spec;
}
/** Identity helper that preserves literal types for config-driven charts. */
function defineChart(definition) {
	return definition;
}
/** Minimal in-memory registry: 80% declarative charts, 20% escape hatch. */
var ChartRegistry = class {
	charts = /* @__PURE__ */ new Map();
	register(definition) {
		if (this.charts.has(definition.id)) throw new Error(`Chart "${definition.id}" is already registered.`);
		this.charts.set(definition.id, definition);
		return this;
	}
	get(id) {
		return this.charts.get(id);
	}
	list() {
		return [...this.charts.values()];
	}
	listBySyncGroup(group) {
		return this.list().filter((chart) => chart.syncGroup === group);
	}
};
//#endregion
export { ChartRegistry, defineChart, defineChartSpec };

//# sourceMappingURL=types.js.map