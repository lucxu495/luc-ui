import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/layout/section.tsx
const gapClass = {
	sm: "gap-3",
	md: "gap-5",
	lg: "gap-7"
};
/** A titled block of page content with a consistent header rhythm. */
function Section({ className, title, description, actions, gap = "md", children, ...props }) {
	return /* @__PURE__ */ jsxs("section", {
		"data-slot": "section",
		className: cn("flex flex-col", gapClass[gap], className),
		...props,
		children: [title || description || actions ? /* @__PURE__ */ jsxs("header", {
			className: "flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-col gap-1",
				children: [title ? /* @__PURE__ */ jsx("h2", {
					className: "text-heading-sm text-fg-primary",
					children: title
				}) : null, description ? /* @__PURE__ */ jsx("p", {
					className: "max-w-[var(--container-prose)] text-body text-fg-secondary",
					children: description
				}) : null]
			}), actions ? /* @__PURE__ */ jsx("div", {
				className: "flex shrink-0 items-center gap-2",
				children: actions
			}) : null]
		}) : null, children]
	});
}
//#endregion
export { Section };

//# sourceMappingURL=section.js.map