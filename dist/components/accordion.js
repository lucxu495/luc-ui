"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Accordion, Collapsible } from "radix-ui";
import { createContext, useContext } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
//#region src/components/accordion.tsx
/**
* LUC Accordion — a stack of sections where one (or several) is open.
*
* Radix owns the disclosure model: `aria-expanded` / `aria-controls`, the
* header button, roving arrow keys, Home/End, and a single-open mode that never
* silently closes the last item. LUC owns the surface, the row rhythm and the
* movement — the panel does not "pop" open, it settles (`luc-layer-rise`), which
* is the same gesture the Popover and the Card stack use.
*
*   Accordion   a set of sections that open and close
*   Collapsible one section, no item wrapper, no roving focus
*/
const Accordion$1 = Accordion.Root;
const Collapsible$1 = Collapsible.Root;
const CollapsibleTrigger = Collapsible.Trigger;
const AccordionVariantContext = createContext("card");
function AccordionItem({ className, variant, ...props }) {
	return /* @__PURE__ */ jsx(AccordionVariantContext.Provider, {
		value: variant ?? "card",
		children: /* @__PURE__ */ jsx(Accordion.Item, {
			"data-slot": "accordion-item",
			className: cn("group/accordion-item luc-transition", "data-[state=open]:shadow-rest", variant === "flush" ? "border-b border-line-subtle last:border-b-0" : "overflow-hidden rounded-lg border border-line-subtle bg-surface-default shadow-rest open:shadow-hover", className),
			...props
		})
	});
}
function AccordionTrigger({ className, children, icon, aside, ...props }) {
	const variant = useContext(AccordionVariantContext);
	return /* @__PURE__ */ jsx(Accordion.Header, {
		className: "flex",
		children: /* @__PURE__ */ jsxs(Accordion.Trigger, {
			"data-slot": "accordion-trigger",
			className: cn("flex flex-1 items-center gap-3 text-left text-label text-fg-primary", "cursor-pointer select-none luc-transition", "hover:bg-surface-interactive-hover hover:text-fg-primary", "data-[state=open]:text-fg-primary", "luc-focus-inset", variant === "flush" ? "px-1 py-3.5" : "px-4 py-3.5", className),
			...props,
			children: [
				icon ? /* @__PURE__ */ jsx("span", {
					className: "grid size-7 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-secondary luc-transition group-hover/accordion-item:shadow-xs",
					children: icon
				}) : null,
				/* @__PURE__ */ jsx("span", {
					className: "min-w-0 flex-1",
					children
				}),
				aside ? /* @__PURE__ */ jsx("span", {
					className: "shrink-0",
					children: aside
				}) : null,
				/* @__PURE__ */ jsx(RiArrowDownSLine, {
					"aria-hidden": "true",
					className: cn("size-4 shrink-0 text-fg-muted luc-transition", "group-data-[state=open]/accordion-item:text-fg-accent", "group-data-[state=open]/accordion-item:rotate-180")
				})
			]
		})
	});
}
function AccordionContent({ className, children, padded = true, ...props }) {
	const variant = useContext(AccordionVariantContext);
	return /* @__PURE__ */ jsx(Accordion.Content, {
		"data-slot": "accordion-content",
		className: cn("overflow-hidden text-label text-fg-secondary", "data-[state=open]:animate-[luc-accordion-down_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-accordion-up_var(--motion-normal)_var(--ease-exit)]", className),
		...props,
		children: /* @__PURE__ */ jsx("div", {
			className: cn("border-t border-line-subtle", padded && (variant === "flush" ? "px-1 py-3" : "px-4 py-3.5")),
			children
		})
	});
}
function CollapsibleContent({ className, children, padded = true, ...props }) {
	return /* @__PURE__ */ jsx(Collapsible.Content, {
		"data-slot": "collapsible-content",
		className: cn("overflow-hidden text-label text-fg-secondary", "data-[state=open]:animate-[luc-collapsible-down_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-collapsible-up_var(--motion-normal)_var(--ease-exit)]", padded && "py-3", className),
		...props,
		children
	});
}
/**
* A disclosure row for `Collapsible` that looks like the Accordion's trigger.
*
* Exported separately rather than shared with `AccordionTrigger` because the
* two are different ARIA roles (`button` with `aria-expanded` either way, but
* only the Accordion trigger participates in the header/roving-focus model).
*/
function CollapsibleTriggerRow({ className, children, aside, ...props }) {
	return /* @__PURE__ */ jsxs(Collapsible.Trigger, {
		"data-slot": "collapsible-trigger",
		className: cn("group/collapsible flex w-full items-center gap-3 text-left text-label text-fg-primary", "cursor-pointer select-none rounded-md px-3 py-2.5 luc-transition", "hover:bg-surface-interactive-hover", "luc-focus-inset", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "min-w-0 flex-1",
				children
			}),
			aside ? /* @__PURE__ */ jsx("span", {
				className: "shrink-0",
				children: aside
			}) : null,
			/* @__PURE__ */ jsx(RiArrowDownSLine, {
				"aria-hidden": "true",
				className: "size-4 shrink-0 text-fg-muted luc-transition group-data-[state=open]/collapsible:rotate-180"
			})
		]
	});
}
//#endregion
export { Accordion$1 as Accordion, AccordionContent, AccordionItem, AccordionTrigger, Collapsible$1 as Collapsible, CollapsibleContent, CollapsibleTrigger, CollapsibleTriggerRow };

//# sourceMappingURL=accordion.js.map