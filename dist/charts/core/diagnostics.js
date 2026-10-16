function collectChartDiagnostics(chart) {
	const zr = chart?.getZr?.();
	const displayList = zr?.storage?.getDisplayList?.(void 0, false);
	if (!displayList) return null;
	const dpr = zr?.painter?.getDpr?.() ?? 1;
	const marks = {};
	const spans = [];
	const containers = [];
	let dropped = 0;
	const round = (value) => Math.round(value * 10) / 10;
	for (const item of displayList) {
		const type = item?.type ?? "unknown";
		marks[type] = (marks[type] ?? 0) + 1;
		if (type !== "text" && type !== "tspan") continue;
		const rect = item.getBoundingRect?.();
		if (!rect) continue;
		const transform = item.getComputedTransform?.() ?? item.transform ?? null;
		const [ta, tb, tc, td, te, tf] = transform ?? [];
		const corners = [
			[rect.x, rect.y],
			[rect.x + rect.width, rect.y],
			[rect.x, rect.y + rect.height],
			[rect.x + rect.width, rect.y + rect.height]
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
		if (bucket.length >= 400) {
			dropped += 1;
			continue;
		}
		bucket.push({
			t: (item.style?.text ?? "").slice(0, 48),
			x: round(minX / dpr),
			y: round(minY / dpr),
			w: round((maxX - minX) / dpr),
			h: round((maxY - minY) / dpr)
		});
	}
	const chosen = spans.length > 0 ? spans : containers;
	return {
		marks,
		m: Object.values(marks).reduce((sum, count) => sum + count, 0),
		texts: chosen,
		dropped,
		dpr
	};
}
/**
* The digest as it is published: one JSON string, and `null` when the engine has
* not finished a frame yet (which is a fact QA needs to be able to see).
*/
function serializeDiagnostics(diagnostics) {
	return diagnostics ? JSON.stringify(diagnostics) : null;
}
//#endregion
export { collectChartDiagnostics, serializeDiagnostics };

//# sourceMappingURL=diagnostics.js.map