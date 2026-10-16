"use client";
import { cn } from "../utils/cn.js";
import { DateSegment } from "react-aria-components";
import { jsx } from "react/jsx-runtime";
//#region src/datetime/segments.tsx
const segmentClass = cn("rounded-xs px-1 py-1 text-label text-fg-primary outline-none luc-numeric luc-transition", "data-[placeholder]:text-fg-muted", "data-[type=literal]:px-0.5 data-[type=literal]:text-fg-muted", "data-[focused]:bg-accent-soft data-[focused]:text-fg-accent", "data-[disabled]:text-fg-disabled");
/** ICU whitespace that varies between runtimes, normalised to a plain space. */
function normalizeLiteral(text) {
	return text.replace(/[\u00a0\u202f\u2009]/g, " ");
}
function renderSegment(segment) {
	if (segment.type === "literal") return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: "px-0.5 text-fg-muted",
		children: normalizeLiteral(segment.text)
	});
	return /* @__PURE__ */ jsx(DateSegment, {
		segment,
		className: segmentClass
	});
}
//#endregion
export { renderSegment, segmentClass };

//# sourceMappingURL=segments.js.map