"use client";
import { Button } from "../../components/button-base.js";
import { Tooltip } from "../../components/tooltip.js";
import { exportChartImage } from "../core/export.js";
import { jsx } from "react/jsx-runtime";
import { useState } from "react";
import { RiDownloadLine, RiRestartLine } from "@remixicon/react";
//#region src/charts/components/chart-toolbar.tsx
/**
* Image export. Disabled until the chart reports an instance, so a click can
* never produce a blank file.
*/
function ChartExportButton({ getTarget, filename, label = "Export PNG", className }) {
	const [busy, setBusy] = useState(false);
	return /* @__PURE__ */ jsx(Tooltip, {
		content: label,
		side: "bottom",
		children: /* @__PURE__ */ jsx(Button, {
			size: "sm",
			variant: "ghost",
			className,
			loading: busy,
			leadingIcon: busy ? void 0 : /* @__PURE__ */ jsx(RiDownloadLine, {}),
			onClick: async () => {
				const target = getTarget();
				if (!target) return;
				setBusy(true);
				try {
					await exportChartImage(target, { filename });
				} finally {
					setBusy(false);
				}
			},
			children: /* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: label
			})
		})
	});
}
/** Reset zoom / visible range. Appears only when the caller tracks that state. */
function ChartResetButton({ onReset, label = "Reset zoom", className }) {
	return /* @__PURE__ */ jsx(Tooltip, {
		content: label,
		side: "bottom",
		children: /* @__PURE__ */ jsx(Button, {
			size: "sm",
			variant: "ghost",
			className,
			leadingIcon: /* @__PURE__ */ jsx(RiRestartLine, {}),
			onClick: onReset,
			children: /* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: label
			})
		})
	});
}
/** Thin wrapper so a chart toolbar's item spacing stays consistent. */
function ChartToolbarGroup({ children, className }) {
	return /* @__PURE__ */ jsx("div", {
		className: className ? `flex items-center gap-1.5 ${className}` : "flex items-center gap-1.5",
		children
	});
}
//#endregion
export { ChartExportButton, ChartResetButton, ChartToolbarGroup };

//# sourceMappingURL=chart-toolbar.js.map