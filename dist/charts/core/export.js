import { normalizeCssColor } from "./theme.js";
//#region src/charts/core/export.ts
/**
* Chart image export.
*
* Both engines can hand back a canvas, so export is one function with two
* branches and no shared state. Data export (CSV) and shareable URL state are
* deliberately out of scope — see docs/CHART_GUIDE.md.
*/
function triggerDownload(href, filename) {
	const link = document.createElement("a");
	link.href = href;
	link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
	link.rel = "noopener";
	document.body.appendChild(link);
	link.click();
	link.remove();
}
function resolveBackground(explicit) {
	if (explicit) return explicit;
	if (typeof document === "undefined") return "#ffffff";
	const value = getComputedStyle(document.documentElement).getPropertyValue("--surface-raised").trim();
	if (!value) return "#ffffff";
	return normalizeCssColor(value) || "#ffffff";
}
/**
* Export a chart instance to a PNG download.
*
* Accepts an ECharts instance (has `getDataURL`) or a Lightweight Charts chart
* (has `takeScreenshot`). A target that is neither resolves quietly rather than
* throwing inside a click handler.
*/
async function exportChartImage(target, options) {
	if (typeof document === "undefined" || !target) return false;
	const background = resolveBackground(options.backgroundColor);
	const echartsLike = target;
	if (typeof echartsLike.getDataURL === "function") {
		triggerDownload(echartsLike.getDataURL({
			type: "png",
			pixelRatio: options.pixelRatio ?? 2,
			backgroundColor: background
		}), options.filename);
		return true;
	}
	const lightweightLike = target;
	if (typeof lightweightLike.takeScreenshot === "function") {
		const source = lightweightLike.takeScreenshot();
		const canvas = document.createElement("canvas");
		canvas.width = source.width;
		canvas.height = source.height;
		const context = canvas.getContext("2d");
		if (!context) return false;
		context.fillStyle = background;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(source, 0, 0);
		triggerDownload(canvas.toDataURL("image/png"), options.filename);
		return true;
	}
	return false;
}
//#endregion
export { exportChartImage };

//# sourceMappingURL=export.js.map