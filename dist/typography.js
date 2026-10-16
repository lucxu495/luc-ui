import { cn } from "./utils/cn.js";
import { splitNumberParts } from "./utils/format.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/typography.tsx
const toneClass = {
	primary: "text-fg-primary",
	secondary: "text-fg-secondary",
	muted: "text-fg-muted",
	disabled: "text-fg-disabled",
	accent: "text-fg-accent",
	inverse: "text-fg-inverse",
	positive: "text-fg-positive",
	negative: "text-fg-negative"
};
const variantClass = {
	"body-lg": "text-body-lg",
	body: "text-body",
	label: "text-label",
	caption: "text-caption",
	micro: "text-micro uppercase"
};
const headingClass = {
	display: "text-display font-display",
	"display-sm": "text-display-sm font-display",
	heading: "text-heading font-display",
	"heading-sm": "text-heading-sm font-display",
	title: "text-title"
};
function Text({ className, variant = "body", tone = "primary", truncate, as = "p", ...props }) {
	return /* @__PURE__ */ jsx(as, {
		"data-slot": "text",
		className: cn(variantClass[variant], toneClass[tone], truncate && "truncate", className),
		...props
	});
}
/** Headings use the display face. Only one `display` per view, please. */
function Heading({ className, size = "heading-sm", tone = "primary", as = "h2", ...props }) {
	return /* @__PURE__ */ jsx(as, {
		"data-slot": "heading",
		className: cn(headingClass[size], toneClass[tone], "text-balance", className),
		...props
	});
}
function Code({ className, block = false, ...props }) {
	if (block) return /* @__PURE__ */ jsx("code", {
		"data-slot": "code",
		tabIndex: 0,
		className: cn("block overflow-x-auto rounded-md border border-line-subtle bg-surface-sunken p-3 whitespace-pre [contain:inline-size] [scrollbar-gutter:stable]", "font-mono text-caption leading-relaxed text-fg-secondary", className),
		...props
	});
	return /* @__PURE__ */ jsx("code", {
		"data-slot": "code",
		className: cn("rounded-xs border border-line-subtle bg-surface-sunken px-1 py-px", "font-mono text-[0.92em] text-fg-secondary", className),
		...props
	});
}
function Kbd({ className, variant = "default", size = "md", ...props }) {
	return /* @__PURE__ */ jsx("kbd", {
		"data-slot": "kbd",
		className: cn("inline-flex items-center justify-center gap-0.5 rounded-xs luc-numeric", "border border-line-default bg-surface-interactive px-1", "font-mono text-fg-muted", size === "sm" ? "h-4 min-w-4 text-[9px]" : "h-[18px] min-w-[18px] text-[10px]", variant === "raised" ? "shadow-rest" : "shadow-xs", className),
		...props
	});
}
/**
* Numeric text with guaranteed stable width.
*
* Digits use tabular figures and a non-breaking grouping character so a
* changing value never reflows its surroundings. This is the primitive every
* metric, price and percentage is built from.
*/
function NumericText({ className, value, kind = "number", currency, suffix, signed, locale, minimumFractionDigits, maximumFractionDigits, ...props }) {
	const parts = splitNumberParts(value, {
		kind,
		currency,
		suffix,
		signed,
		locale,
		minimumFractionDigits,
		maximumFractionDigits
	});
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "numeric-text",
		"data-numeric": true,
		className: cn("luc-numeric tabular-nums", className),
		...props,
		children: value === null || value === void 0 || !Number.isFinite(value) ? "—" : parts.formatted
	});
}
//#endregion
export { Code, Heading, Kbd, NumericText, Text };

//# sourceMappingURL=typography.js.map