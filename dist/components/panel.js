import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/panel.tsx
const toneClass = {
	default: "bg-surface-default",
	sunken: "bg-surface-sunken",
	raised: "bg-surface-raised shadow-rest"
};
/**
* LUC Panel — a dense, low-chrome surface for toolbars, sidebars, code blocks
* and nested regions. Panels do not carry elevation by default; they are the
* structural layer beneath Cards.
*/
function Panel({ className, tone = "default", bordered = true, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "panel",
		className: cn("rounded-lg", toneClass[tone], bordered && "border border-line-subtle", className),
		...props
	});
}
function PanelHeader({ className, actions, children, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "panel-header",
		className: cn("flex min-h-11 flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-3.5 py-2", className),
		...props,
		children: [/* @__PURE__ */ jsx("div", {
			className: "flex min-w-0 items-center gap-2.5 text-label text-fg-secondary",
			children
		}), actions ? /* @__PURE__ */ jsx("div", {
			className: "flex shrink-0 items-center gap-1.5",
			children: actions
		}) : null]
	});
}
function PanelBody({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "panel-body",
		className: cn("p-3.5", className),
		...props
	});
}
//#endregion
export { Panel, PanelBody, PanelHeader };

//# sourceMappingURL=panel.js.map