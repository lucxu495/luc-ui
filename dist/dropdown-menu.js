"use client";
import { cn } from "./utils/cn.js";
import { MenuShortcut, menuContentClass, menuIndicatorClass, menuItemClass, menuLabelClass, menuRowChildren, menuSeparatorClass, withTrailing } from "./components/menu-shared.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { DropdownMenu as DropdownMenu$1 } from "radix-ui";
import { RiArrowRightSLine, RiCheckLine } from "@remixicon/react";
//#region src/components/dropdown-menu.tsx
/**
* LUC DropdownMenu — actions and options attached to a trigger.
*
* Radix owns the hard parts: the menu/menuitem ARIA model, roving focus,
* typeahead, Escape / arrow / Home / End handling, collision-aware portals,
* submenu open-intent and focus restore. LUC owns the surface and the row
* rhythm — the same language as `ContextMenu`.
*
*   Select        → choose a value from a known set
*   Combobox      → search, then choose a value
*   DropdownMenu  → actions or options attached to a trigger
*   ContextMenu   → those actions, attached to a target
*   CommandMenu   → global navigation and search
*/
const DropdownMenu = DropdownMenu$1.Root;
const DropdownMenuTrigger = DropdownMenu$1.Trigger;
const DropdownMenuGroup = DropdownMenu$1.Group;
const DropdownMenuRadioGroup = DropdownMenu$1.RadioGroup;
const DropdownMenuSub = DropdownMenu$1.Sub;
const DropdownMenuPortal = DropdownMenu$1.Portal;
function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenu$1.Portal, { children: /* @__PURE__ */ jsx(DropdownMenu$1.Content, {
		"data-slot": "dropdown-menu-content",
		sideOffset,
		className: cn(menuContentClass, className),
		...props
	}) });
}
function DropdownMenuSubContent({ className, sideOffset = 4, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenu$1.Portal, { children: /* @__PURE__ */ jsx(DropdownMenu$1.SubContent, {
		"data-slot": "dropdown-menu-sub-content",
		sideOffset,
		className: cn(menuContentClass, className),
		...props
	}) });
}
function DropdownMenuItem({ className, variant, inset, shortcut, asChild, children, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenu$1.Item, {
		"data-slot": "dropdown-menu-item",
		className: cn(menuItemClass({
			variant,
			inset
		}), className),
		asChild,
		...props,
		children: menuRowChildren(children, shortcut, asChild)
	});
}
function DropdownMenuCheckboxItem({ className, children, shortcut, ...props }) {
	return /* @__PURE__ */ jsxs(DropdownMenu$1.CheckboxItem, {
		"data-slot": "dropdown-menu-checkbox-item",
		className: cn(menuItemClass(), "pl-8", className),
		...props,
		children: [/* @__PURE__ */ jsx(DropdownMenu$1.ItemIndicator, {
			className: menuIndicatorClass(),
			children: /* @__PURE__ */ jsx(RiCheckLine, { "aria-hidden": "true" })
		}), menuRowChildren(children, shortcut)]
	});
}
function DropdownMenuRadioItem({ className, children, shortcut, ...props }) {
	return /* @__PURE__ */ jsxs(DropdownMenu$1.RadioItem, {
		"data-slot": "dropdown-menu-radio-item",
		className: cn(menuItemClass(), "pl-8", className),
		...props,
		children: [/* @__PURE__ */ jsx(DropdownMenu$1.ItemIndicator, {
			className: menuIndicatorClass(),
			children: /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "size-1.5 rounded-full bg-current"
			})
		}), menuRowChildren(children, shortcut)]
	});
}
function DropdownMenuSubTrigger({ className, inset, asChild, children, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenu$1.SubTrigger, {
		"data-slot": "dropdown-menu-sub-trigger",
		asChild,
		className: cn(menuItemClass({ inset }), "data-[state=open]:bg-surface-interactive-hover data-[state=open]:text-fg-primary", className),
		...props,
		children: withTrailing(children, /* @__PURE__ */ jsx(RiArrowRightSLine, {
			"aria-hidden": "true",
			className: "ml-auto size-4 text-fg-muted"
		}), asChild)
	});
}
function DropdownMenuLabel({ className, inset = true, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenu$1.Label, {
		"data-slot": "dropdown-menu-label",
		className: cn(menuLabelClass(inset), className),
		...props
	});
}
function DropdownMenuSeparator({ className, ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenu$1.Separator, {
		"data-slot": "dropdown-menu-separator",
		className: cn(menuSeparatorClass, className),
		...props
	});
}
/** Trailing keyboard hint inside a custom row. */
const DropdownMenuShortcut = MenuShortcut;
//#endregion
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger };

//# sourceMappingURL=dropdown-menu.js.map