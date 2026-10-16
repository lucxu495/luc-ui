import { cn } from "./utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/empty-state.tsx
function EmptyState({ className, icon, title, description, action, secondaryAction, size = "md", titleAs: TitleTag = "p", children, ...props }) {
	const compact = size === "sm";
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "empty-state",
		"data-size": size,
		className: cn("flex flex-col items-center justify-center text-center", compact ? "gap-1.5 px-4 py-6" : "gap-2 px-6 py-10", className),
		...props,
		children: [
			icon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("grid shrink-0 place-items-center rounded-lg border border-line-subtle bg-surface-interactive text-fg-muted", compact ? "mb-0.5 size-8 [&_svg]:size-4" : "mb-1 size-10 [&_svg]:size-5"),
				children: icon
			}) : null,
			/* @__PURE__ */ jsx(TitleTag, {
				className: cn("text-fg-primary", compact ? "text-label" : "text-title"),
				children: title
			}),
			description ? /* @__PURE__ */ jsx("p", {
				className: cn("max-w-[46ch] text-balance", compact ? "text-caption" : "text-body", "text-fg-muted"),
				children: description
			}) : null,
			children,
			action || secondaryAction ? /* @__PURE__ */ jsxs("div", {
				className: cn("flex flex-wrap items-center justify-center gap-2", compact ? "pt-1" : "pt-2"),
				children: [action, secondaryAction]
			}) : null
		]
	});
}
//#endregion
export { EmptyState };

//# sourceMappingURL=empty-state.js.map