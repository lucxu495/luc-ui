import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiAlertLine, RiCheckboxCircleLine, RiCloseCircleLine, RiInboxLine, RiInformationLine } from "@remixicon/react";
//#region src/components/result.tsx
const statusStyles = {
	success: {
		mark: "border-positive-line bg-positive-soft text-fg-positive",
		defaultIcon: /* @__PURE__ */ jsx(RiCheckboxCircleLine, {})
	},
	error: {
		mark: "border-negative-line bg-negative-soft text-fg-negative",
		defaultIcon: /* @__PURE__ */ jsx(RiCloseCircleLine, {})
	},
	warning: {
		mark: "border-warning-line bg-warning-soft text-fg-warning",
		defaultIcon: /* @__PURE__ */ jsx(RiAlertLine, {})
	},
	info: {
		mark: "border-info-line bg-info-soft text-fg-info",
		defaultIcon: /* @__PURE__ */ jsx(RiInformationLine, {})
	},
	empty: {
		mark: "border-line-default bg-surface-sunken text-fg-muted",
		defaultIcon: /* @__PURE__ */ jsx(RiInboxLine, {})
	}
};
function Result({ className, status, title, description, icon, extra, children, size = "md", titleAs: TitleTag = "h1", ...props }) {
	const styles = statusStyles[status];
	const resolvedIcon = icon === void 0 ? styles.defaultIcon : icon;
	const compact = size === "sm";
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "result",
		"data-status": status,
		"data-size": size,
		className: cn("flex flex-col items-center text-center", compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12", className),
		...props,
		children: [
			resolvedIcon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("grid shrink-0 place-items-center rounded-full border", compact ? "size-10 [&_svg]:size-5" : "size-14 [&_svg]:size-7", styles.mark),
				children: resolvedIcon
			}) : null,
			/* @__PURE__ */ jsx(TitleTag, {
				className: cn("text-balance font-medium text-fg-primary", compact ? "text-title" : "text-display-sm", compact ? void 0 : "font-semibold tracking-[-0.02em]"),
				children: title
			}),
			description ? /* @__PURE__ */ jsx("p", {
				className: cn("max-w-[58ch] text-balance text-fg-secondary", compact ? "text-caption" : "text-body"),
				children: description
			}) : null,
			children,
			extra ? /* @__PURE__ */ jsx("div", {
				className: cn("flex flex-wrap items-center justify-center gap-2", compact ? "pt-1" : "pt-2"),
				children: extra
			}) : null
		]
	});
}
//#endregion
export { Result };

//# sourceMappingURL=result.js.map