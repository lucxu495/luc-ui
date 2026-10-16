import { cn } from "../utils/cn.js";
import { Badge } from "../components/badge.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/data/status-badge.tsx
const statusPresets = {
	live: {
		tone: "positive",
		label: "Live",
		pulse: true
	},
	healthy: {
		tone: "positive",
		label: "Healthy"
	},
	positive: {
		tone: "positive",
		label: "Positive"
	},
	degraded: {
		tone: "warning",
		label: "Degraded"
	},
	pending: {
		tone: "info",
		label: "Pending"
	},
	stale: {
		tone: "warning",
		label: "Stale"
	},
	down: {
		tone: "negative",
		label: "Down"
	},
	negative: {
		tone: "negative",
		label: "Negative"
	},
	unknown: {
		tone: "neutral",
		label: "Unknown"
	}
};
function StatusBadge({ className, status, label, size = "md", ...props }) {
	const preset = statusPresets[status];
	return /* @__PURE__ */ jsxs(Badge, {
		"data-slot": "status-badge",
		"data-status": status,
		tone: preset.tone,
		size,
		className: cn("gap-1.5", className),
		...props,
		children: [/* @__PURE__ */ jsxs("span", {
			className: "relative flex size-1.5 shrink-0 items-center justify-center",
			children: [/* @__PURE__ */ jsx("span", { className: "absolute inline-flex size-full rounded-full bg-current opacity-70" }), preset.pulse ? /* @__PURE__ */ jsx("span", {
				"data-motion-essential": true,
				className: "absolute inline-flex size-full animate-pulse-soft rounded-full bg-current"
			}) : null]
		}), label ?? preset.label]
	});
}
//#endregion
export { StatusBadge, statusPresets };

//# sourceMappingURL=status-badge.js.map