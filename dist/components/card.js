import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
//#region src/components/card.tsx
const cardVariants = cva("relative flex flex-col", {
	variants: {
		variant: {
			/** Quiet at rest: hairlined surface on the canvas. */
			default: "rounded-lg border border-line-subtle bg-surface-default shadow-rest",
			/** Higher in the stack: brighter surface, deeper shadow. */
			raised: "rounded-lg border border-line-subtle bg-surface-raised shadow-layer-2",
			/** Transparent shell for content that already has its own surface. */
			outline: "rounded-lg border border-line-default bg-transparent",
			/** No chrome at all — grouping only. */
			ghost: "rounded-lg"
		},
		interactive: {
			true: [
				"cursor-pointer luc-transition luc-press",
				"hover:border-line-default hover:bg-surface-interactive-hover hover:shadow-hover",
				"luc-focus"
			],
			false: ""
		},
		interaction: {
			static: "",
			interactive: ["cursor-pointer luc-transition luc-press luc-focus", "hover:translate-y-[calc(-1*var(--spatial-lift))] hover:border-line-default hover:bg-surface-interactive-hover hover:shadow-hover"],
			selectable: [
				"cursor-pointer luc-transition luc-press luc-focus",
				"hover:translate-y-[calc(-1*var(--spatial-lift))] hover:border-line-default hover:shadow-hover",
				"data-[selected=true]:border-accent-default data-[selected=true]:bg-surface-selected"
			],
			featured: [
				"cursor-pointer luc-transition luc-press luc-focus",
				"border-line-default shadow-[var(--layer-2-shadow),var(--glow-subtle)]",
				"hover:translate-y-[calc(-1*var(--spatial-lift))] hover:shadow-[var(--layer-3-shadow),var(--glow-accent)]"
			]
		},
		selected: {
			true: "border-line-accent bg-surface-selected shadow-[var(--layer-2-shadow),var(--glow-subtle)]",
			false: ""
		},
		padding: {
			none: "p-0",
			sm: "p-3",
			md: "p-4",
			lg: "p-5"
		}
	},
	defaultVariants: {
		variant: "default",
		interactive: false,
		interaction: "static",
		selected: false,
		padding: "none"
	}
});
/**
* LUC Card — foundational surface.
*
* Deliberately quiet: a hairline, a small shadow, a luminance step above the
* canvas. Interactive and selected states are opt-in. Creative effects
* (BorderGlow, SpotlightSurface) *wrap* a Card; they are never baked in.
*/
function Card({ className, variant, interactive, interaction, selected, padding, as = "div", ...props }) {
	return /* @__PURE__ */ jsx(as, {
		"data-slot": "card",
		"data-interaction": interaction && interaction !== "static" ? interaction : void 0,
		"data-selected": selected || void 0,
		className: cn(cardVariants({
			variant,
			interactive,
			interaction,
			selected,
			padding
		}), className),
		...props
	});
}
function CardHeader({ className, actions, icon, children, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "card-header",
		className: cn("flex items-start gap-3 border-b border-line-subtle px-4 py-3.5", className),
		...props,
		children: [
			icon ? /* @__PURE__ */ jsx("span", {
				className: "grid size-8 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-secondary",
				children: icon
			}) : null,
			/* @__PURE__ */ jsx("div", {
				className: "flex min-w-0 flex-1 flex-col gap-0.5",
				children
			}),
			actions ? /* @__PURE__ */ jsx("div", {
				className: "flex shrink-0 items-center gap-1.5",
				children: actions
			}) : null
		]
	});
}
function CardTitle({ className, children, ...props }) {
	return /* @__PURE__ */ jsx("h3", {
		"data-slot": "card-title",
		className: cn("text-title text-fg-primary", className),
		...props,
		children
	});
}
function CardDescription({ className, ...props }) {
	return /* @__PURE__ */ jsx("p", {
		"data-slot": "card-description",
		className: cn("text-caption text-fg-muted", className),
		...props
	});
}
function CardContent({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-content",
		className: cn("flex min-w-0 flex-col gap-3 p-4", className),
		...props
	});
}
function CardFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-footer",
		className: cn("mt-auto flex flex-wrap items-center gap-2 border-t border-line-subtle px-4 py-3", className),
		...props
	});
}
//#endregion
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };

//# sourceMappingURL=card.js.map