"use client";
import { cn } from "./utils/cn.js";
import { MenuShortcut, menuContentClass, menuIndicatorClass, menuItemClass, menuLabelClass, menuRowChildren, menuSeparatorClass, withTrailing } from "./components/menu-shared.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { ContextMenu as ContextMenu$1 } from "radix-ui";
import { RiArrowRightSLine, RiCheckLine } from "@remixicon/react";
//#region src/components/context-menu.tsx
const ContextMenu = ContextMenu$1.Root;
const ContextMenuTrigger = ContextMenu$1.Trigger;
const ContextMenuGroup = ContextMenu$1.Group;
const ContextMenuRadioGroup = ContextMenu$1.RadioGroup;
const ContextMenuSub = ContextMenu$1.Sub;
const ContextMenuPortal = ContextMenu$1.Portal;
function ContextMenuContent({ className, ...props }) {
	return /* @__PURE__ */ jsx(ContextMenu$1.Portal, { children: /* @__PURE__ */ jsx(ContextMenu$1.Content, {
		"data-slot": "context-menu-content",
		className: cn(menuContentClass, className),
		...props
	}) });
}
function ContextMenuSubContent({ className, ...props }) {
	return /* @__PURE__ */ jsx(ContextMenu$1.Portal, { children: /* @__PURE__ */ jsx(ContextMenu$1.SubContent, {
		"data-slot": "context-menu-sub-content",
		className: cn(menuContentClass, className),
		...props
	}) });
}
function ContextMenuItem({ className, variant, inset, shortcut, asChild, children, ...props }) {
	return /* @__PURE__ */ jsx(ContextMenu$1.Item, {
		"data-slot": "context-menu-item",
		className: cn(menuItemClass({
			variant,
			inset
		}), className),
		asChild,
		...props,
		children: menuRowChildren(children, shortcut, asChild)
	});
}
function ContextMenuCheckboxItem({ className, children, shortcut, ...props }) {
	return /* @__PURE__ */ jsxs(ContextMenu$1.CheckboxItem, {
		"data-slot": "context-menu-checkbox-item",
		className: cn(menuItemClass(), "pl-8", className),
		...props,
		children: [/* @__PURE__ */ jsx(ContextMenu$1.ItemIndicator, {
			className: menuIndicatorClass(),
			children: /* @__PURE__ */ jsx(RiCheckLine, { "aria-hidden": "true" })
		}), menuRowChildren(children, shortcut)]
	});
}
function ContextMenuRadioItem({ className, children, shortcut, ...props }) {
	return /* @__PURE__ */ jsxs(ContextMenu$1.RadioItem, {
		"data-slot": "context-menu-radio-item",
		className: cn(menuItemClass(), "pl-8", className),
		...props,
		children: [/* @__PURE__ */ jsx(ContextMenu$1.ItemIndicator, {
			className: menuIndicatorClass(),
			children: /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "size-1.5 rounded-full bg-current"
			})
		}), menuRowChildren(children, shortcut)]
	});
}
function ContextMenuSubTrigger({ className, inset, asChild, children, ...props }) {
	return /* @__PURE__ */ jsx(ContextMenu$1.SubTrigger, {
		"data-slot": "context-menu-sub-trigger",
		asChild,
		className: cn(menuItemClass({ inset }), "data-[state=open]:bg-surface-interactive-hover data-[state=open]:text-fg-primary", className),
		...props,
		children: withTrailing(children, /* @__PURE__ */ jsx(RiArrowRightSLine, {
			"aria-hidden": "true",
			className: "ml-auto size-4 text-fg-muted"
		}), asChild)
	});
}
function ContextMenuLabel({ className, inset = true, ...props }) {
	return /* @__PURE__ */ jsx(ContextMenu$1.Label, {
		"data-slot": "context-menu-label",
		className: cn(menuLabelClass(inset), className),
		...props
	});
}
function ContextMenuSeparator({ className, ...props }) {
	return /* @__PURE__ */ jsx(ContextMenu$1.Separator, {
		"data-slot": "context-menu-separator",
		className: cn(menuSeparatorClass, className),
		...props
	});
}
/** Trailing keyboard hint inside a custom row. */
const ContextMenuShortcut = MenuShortcut;
//#endregion
export { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger };

//# sourceMappingURL=context-menu.js.map