//#region src/charts/adapters/lightweight/runtime.ts
let loading = null;
function loadLightweightCharts() {
	if (!loading) loading = import("lightweight-charts");
	return loading;
}
/** Chart engines take seconds; LUC's canonical time unit is milliseconds. */
function toChartTime(ms) {
	return Math.floor(ms / 1e3);
}
function fromChartTime(time) {
	if (typeof time === "number") return time * 1e3;
	if (typeof time === "string") {
		const parsed = Date.parse(time);
		return Number.isNaN(parsed) ? null : parsed;
	}
	if (time && typeof time === "object" && "year" in time) return Date.UTC(time.year, time.month - 1, time.day);
	return null;
}
//#endregion
export { fromChartTime, loadLightweightCharts, toChartTime };

//# sourceMappingURL=runtime.js.map