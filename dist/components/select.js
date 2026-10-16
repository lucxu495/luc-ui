"use client";
import { cn } from "../utils/cn.js";
import { useField } from "./field.js";
import { inputAdornmentClass } from "./input.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Select as Select$1 } from "radix-ui";
import { createContext, useContext } from "react";
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine, RiExpandUpDownLine } from "@remixicon/react";
//#region src/components/select.tsx
/**
* LUC Select — choosing one value from a *known, finite* option set.
*
* Radix Select supplies the hard parts: the listbox/option ARIA model, typeahead,
* roving focus, portal collision handling, scroll buttons and the `aria-activedescendant`
* contract. LUC supplies the trigger (identical chrome to `Input`), the menu
* surface, the row rhythm and the selection indicator.
*
* Select is not a search box and not a command palette:
*   Select     → pick one of a handful of known options
*   Combobox   → search/filter, then pick
*   CommandMenu→ *execute* something (navigate, run, toggle)
* See AI_DESIGN_GUIDE.md §selection semantics.
*/
const SizeContext = createContext("md");
/** Raw Radix root, for callers who do not want the LUC size context. */
const SelectRoot = Select$1.Root;
const SelectValue = Select$1.Value;
const SelectGroup = Select$1.Group;
const SelectSeparator = Select$1.Separator;
/**
* `Select` is the sized root: one `size` drives the trigger height, the type
* scale and the menu rhythm, so a product never hand-tunes a dropdown.
*/
function Select({ size = "md", children, ...props }) {
	return /* @__PURE__ */ jsx(SizeContext.Provider, {
		value: size,
		children: /* @__PURE__ */ jsx(Select$1.Root, {
			...props,
			children
		})
	});
}
const triggerSize = {
	sm: "h-control-sm rounded-sm pl-2.5 pr-8 text-label",
	md: "h-control-md rounded-md pl-3 pr-8 text-label",
	lg: "h-control-lg rounded-md pl-3.5 pr-9 text-body"
};
function SelectTrigger({ className, children, size, leadingIcon, invalid, disabled, id, ...props }) {
	const contextSize = useContext(SizeContext);
	const field = useField();
	const resolved = size ?? contextSize;
	const isInvalid = invalid ?? field.invalid;
	return /* @__PURE__ */ jsxs(Select$1.Trigger, {
		"data-slot": "select-trigger",
		"data-size": resolved,
		id: id ?? field.id,
		disabled: disabled ?? field.disabled,
		"aria-invalid": isInvalid || void 0,
		"aria-describedby": props["aria-describedby"] ?? field.describedBy,
		className: cn("group/select relative inline-flex w-full items-center gap-2", "border border-line-default bg-surface-sunken text-left text-fg-primary shadow-well", "luc-transition", "hover:border-line-strong hover:bg-surface-interactive hover:shadow-rest", "data-[state=open]:border-line-accent", "data-[state=open]:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]", "focus-visible:border-line-accent focus-visible:outline-none", "focus-visible:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]", "data-[placeholder]:text-fg-muted", "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line-default disabled:hover:bg-surface-sunken", "aria-[invalid=true]:border-negative aria-[invalid=true]:shadow-[0_0_0_3px_var(--negative-soft)]", triggerSize[resolved], className),
		...props,
		children: [
			leadingIcon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn(inputAdornmentClass, "text-fg-muted group-data-[state=open]/select:text-fg-accent", resolved === "sm" ? "size-3.5" : resolved === "lg" ? "size-[18px]" : "size-4"),
				children: leadingIcon
			}) : null,
			/* @__PURE__ */ jsx("span", {
				className: "min-w-0 flex-1 truncate",
				children
			}),
			/* @__PURE__ */ jsx(Select$1.Icon, {
				asChild: true,
				children: /* @__PURE__ */ jsx(RiExpandUpDownLine, {
					"aria-hidden": "true",
					className: cn("pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-muted luc-transition", "group-data-[state=open]/select:text-fg-accent", resolved === "sm" ? "size-3.5" : "size-4")
				})
			})
		]
	});
}
function SelectContent({ className, children, size, position = "popper", sideOffset = 6, ...props }) {
	const contextSize = useContext(SizeContext);
	const resolved = size ?? contextSize;
	return /* @__PURE__ */ jsx(Select$1.Portal, { children: /* @__PURE__ */ jsxs(Select$1.Content, {
		"data-slot": "select-content",
		position,
		sideOffset,
		className: cn("z-[var(--z-popover)] max-h-[min(20rem,var(--radix-select-content-available-height))]", "min-w-[var(--radix-select-trigger-width)] overflow-hidden", "rounded-lg border border-line-default bg-surface-overlay text-fg-primary luc-float", "origin-[var(--radix-select-content-transform-origin)]", "data-[state=open]:animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]", className),
		...props,
		children: [
			/* @__PURE__ */ jsx(Select$1.ScrollUpButton, {
				className: "flex h-6 cursor-default items-center justify-center bg-surface-overlay text-fg-muted",
				children: /* @__PURE__ */ jsx(RiArrowUpSLine, {
					className: "size-3.5",
					"aria-hidden": "true"
				})
			}),
			/* @__PURE__ */ jsx(Select$1.Viewport, {
				className: cn("p-1 text-label", resolved === "sm" && "py-0.5"),
				children
			}),
			/* @__PURE__ */ jsx(Select$1.ScrollDownButton, {
				className: "flex h-6 cursor-default items-center justify-center bg-surface-overlay text-fg-muted",
				children: /* @__PURE__ */ jsx(RiArrowDownSLine, {
					className: "size-3.5",
					"aria-hidden": "true"
				})
			})
		]
	}) });
}
function SelectItem({ className, children, description, ...props }) {
	return /* @__PURE__ */ jsxs(Select$1.Item, {
		"data-slot": "select-item",
		className: cn("relative flex cursor-default select-none items-start gap-2 rounded-sm py-1.5 pr-2 pl-7", "text-fg-secondary outline-none luc-transition", "data-[highlighted]:bg-surface-interactive-hover data-[highlighted]:text-fg-primary", "data-[state=checked]:text-fg-primary", "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled", className),
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "absolute left-1.5 top-[7px] grid size-4 place-items-center",
			children: /* @__PURE__ */ jsx(Select$1.ItemIndicator, { children: /* @__PURE__ */ jsx(RiCheckLine, {
				"aria-hidden": "true",
				className: "size-4 text-fg-accent"
			}) })
		}), /* @__PURE__ */ jsxs("span", {
			className: "flex min-w-0 flex-col gap-0.5",
			children: [/* @__PURE__ */ jsx(Select$1.ItemText, { children }), description ? /* @__PURE__ */ jsx("span", {
				className: "text-caption text-fg-muted",
				children: description
			}) : null]
		})]
	});
}
function SelectLabel({ className, ...props }) {
	return /* @__PURE__ */ jsx(Select$1.Label, {
		className: cn("px-2 pt-2 pb-1 text-micro font-medium text-fg-muted uppercase", className),
		...props
	});
}
//#endregion
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectRoot, SelectSeparator, SelectTrigger, SelectValue };

//# sourceMappingURL=select.js.map