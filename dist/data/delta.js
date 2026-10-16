import { cn } from "../utils/cn.js";
import { formatNumber, resolveDeltaTone } from "../utils/format.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/data/delta.tsx
const sizeClass = {
	sm: "text-caption",
	md: "text-label",
	lg: "text-body"
};
const toneClass = {
	positive: "text-fg-positive",
	negative: "text-fg-negative",
	neutral: "text-fg-muted"
};
function Delta({ className, value, variant = "percent", invert = false, suffix, kind, currency, arrow = true, size = "md", ...props }) {
	const tone = resolveDeltaTone(value, invert);
	const text = formatNumber(value, {
		kind: kind ?? (variant === "percent" ? "percent" : "decimal"),
		currency,
		suffix,
		signed: true
	});
	return /* @__PURE__ */ jsxs("span", {
		"data-slot": "delta",
		"data-tone": tone,
		className: cn("inline-flex items-center gap-1 font-medium luc-numeric", toneClass[tone], sizeClass[size], className),
		...props,
		children: [arrow && tone !== "neutral" ? /* @__PURE__ */ jsx("svg", {
			viewBox: "0 0 12 12",
			"aria-hidden": "true",
			className: "size-2.5 shrink-0",
			children: tone === "positive" ? /* @__PURE__ */ jsx("path", {
				d: "M6 2.2L10 8.6H2z",
				fill: "currentColor"
			}) : /* @__PURE__ */ jsx("path", {
				d: "M6 9.8L2 3.4h8z",
				fill: "currentColor"
			})
		}) : null, text]
	});
}
//#endregion
export { Delta };

//# sourceMappingURL=delta.js.map