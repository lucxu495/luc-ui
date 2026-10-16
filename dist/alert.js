import { cn } from "./utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiAlertLine, RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from "@remixicon/react";
//#region src/components/alert.tsx
const toneStyles = {
	neutral: {
		edge: "border-l-line-strong",
		icon: "text-fg-muted",
		defaultIcon: /* @__PURE__ */ jsx(RiInformationLine, {})
	},
	info: {
		edge: "border-l-info",
		icon: "text-fg-info",
		defaultIcon: /* @__PURE__ */ jsx(RiInformationLine, {})
	},
	success: {
		edge: "border-l-positive",
		icon: "text-fg-positive",
		defaultIcon: /* @__PURE__ */ jsx(RiCheckboxCircleLine, {})
	},
	warning: {
		edge: "border-l-warning",
		icon: "text-fg-warning",
		defaultIcon: /* @__PURE__ */ jsx(RiAlertLine, {})
	},
	danger: {
		edge: "border-l-negative",
		icon: "text-fg-negative",
		defaultIcon: /* @__PURE__ */ jsx(RiErrorWarningLine, {})
	}
};
const liveRoles = {
	off: void 0,
	polite: "status",
	assertive: "alert"
};
function Alert({ className, tone = "neutral", emphasis = "alert", title, description, icon, actions, onDismiss, dismissLabel = "Dismiss", live = "off", children, ...props }) {
	const styles = toneStyles[tone];
	const resolvedIcon = icon === void 0 ? styles.defaultIcon : icon;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "alert",
		"data-tone": tone,
		"data-emphasis": emphasis,
		role: liveRoles[live],
		className: cn("relative flex items-start gap-3 rounded-lg border border-line-subtle border-l-2 p-3.5", emphasis === "quiet" ? "bg-surface-sunken" : "bg-surface-default", styles.edge, className),
		...props,
		children: [
			resolvedIcon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("mt-0.5 shrink-0 [&_svg]:size-4", styles.icon),
				children: resolvedIcon
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-1 flex-col gap-1",
				children: [
					title ? /* @__PURE__ */ jsx(AlertTitle, { children: title }) : null,
					description ?? children ? /* @__PURE__ */ jsx(AlertDescription, { children: description ?? children }) : null,
					actions ? /* @__PURE__ */ jsx(AlertActions, { children: actions }) : null
				]
			}),
			onDismiss ? /* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": dismissLabel,
				onClick: onDismiss,
				className: cn("-mt-1 -mr-1 grid size-6 shrink-0 place-items-center rounded-sm text-fg-muted luc-transition luc-focus", "hover:bg-surface-interactive-hover hover:text-fg-primary"),
				children: /* @__PURE__ */ jsx(RiCloseLine, {
					"aria-hidden": "true",
					className: "size-4"
				})
			}) : null
		]
	});
}
/**
* A persistent contextual notice. Same surface as `Alert`, quieter by default,
* and never a live region unless the caller asks for one.
*/
function Callout({ emphasis = "quiet", live = "off", ...props }) {
	return /* @__PURE__ */ jsx(Alert, {
		emphasis,
		live,
		...props
	});
}
function AlertTitle({ className, ...props }) {
	return /* @__PURE__ */ jsx("p", {
		"data-slot": "alert-title",
		className: cn("text-label font-medium text-fg-primary", className),
		...props
	});
}
function AlertDescription({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "alert-description",
		className: cn("flex flex-col gap-1 text-caption text-fg-secondary [&_a]:text-fg-accent", className),
		...props
	});
}
function AlertActions({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "alert-actions",
		className: cn("flex flex-wrap items-center gap-2 pt-1", className),
		...props
	});
}
//#endregion
export { Alert, AlertActions, AlertDescription, AlertTitle, Callout };

//# sourceMappingURL=alert.js.map