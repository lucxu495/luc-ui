import { cva } from "class-variance-authority";
//#region src/components/button-variants.ts
/**
* The Button recipe.
*
* Deliberately six variants, not fifteen. Two of them answer the same question
* at different volume — `primary` is the filled accent, `accent` the tinted,
* lower-emphasis twin (it matches `IconButton`'s `accent`). `outline` exists for
* surfaces that already carry elevation; `ghost` for toolbars and dense headers.
*
* `primary` and `accent` carry `luc-sheen` — one soft highlight that crosses the
* fill on hover. It is the family's signature gesture and the only decorative
* motion in the recipe; the global reduced-motion clamp removes it.
*
* This module has no `"use client"` directive on purpose: server components
* (and plain anchors) can apply the recipe without pulling in client code.
*/
const buttonVariants = cva([
	"relative isolate inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
	"font-medium leading-none luc-transition luc-focus luc-press luc-cursor-light",
	"disabled:pointer-events-none disabled:shadow-none",
	"[&_svg]:shrink-0"
], {
	variants: {
		variant: {
			primary: [
				"luc-sheen bg-accent-default text-accent-on-accent shadow-rest",
				"hover:bg-accent-hover hover:shadow-[var(--elevation-hover),var(--glow-subtle)]",
				"active:bg-accent-active",
				"disabled:bg-accent-soft disabled:text-fg-primary"
			],
			accent: [
				"luc-sheen border border-transparent bg-accent-soft text-fg-accent shadow-xs",
				"hover:border-line-accent hover:bg-accent-soft-hover hover:shadow-rest",
				"active:bg-accent-soft-hover",
				"disabled:bg-accent-soft disabled:text-fg-primary"
			],
			secondary: [
				"border border-line-default bg-surface-interactive text-fg-primary shadow-rest",
				"hover:border-line-strong hover:bg-surface-interactive-hover hover:shadow-hover",
				"active:bg-surface-interactive-active active:shadow-active",
				"disabled:border-line-subtle disabled:text-fg-muted"
			],
			outline: [
				"border border-line-default bg-transparent text-fg-primary",
				"hover:border-line-strong hover:bg-surface-interactive-hover hover:shadow-rest",
				"active:bg-surface-interactive-active active:shadow-none",
				"disabled:border-line-subtle disabled:text-fg-muted"
			],
			ghost: [
				"bg-transparent text-fg-secondary",
				"hover:bg-surface-interactive-hover hover:text-fg-primary",
				"active:bg-surface-interactive-active",
				"disabled:text-fg-muted"
			],
			danger: [
				"bg-negative text-fg-inverse shadow-rest",
				"hover:brightness-110 hover:shadow-[var(--elevation-hover),0_0_18px_-8px_var(--negative)]",
				"active:brightness-95",
				"disabled:bg-negative-soft disabled:text-fg-primary"
			]
		},
		size: {
			sm: "h-control-sm gap-1.5 rounded-sm px-2.5 text-label",
			md: "h-control-md rounded-md px-3 text-label",
			lg: "h-control-lg rounded-md px-4 text-body"
		},
		block: {
			true: "w-full",
			false: ""
		}
	},
	defaultVariants: {
		variant: "secondary",
		size: "md",
		block: false
	}
});
//#endregion
export { buttonVariants };

//# sourceMappingURL=button-variants.js.map