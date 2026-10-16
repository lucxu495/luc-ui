"use client";
import { cn } from "../utils/cn.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { cloneElement, isValidElement } from "react";
//#region src/components/menu-shared.tsx
/**
* The shared menu surface.
*
* `DropdownMenu` and `ContextMenu` are two triggers for one menu language, so
* the surface, the row rhythm and the state treatment live here and the two
* families only differ in how they are opened. Nothing in this file is public:
* consumers import `DropdownMenu*` or `ContextMenu*`.
*
* The surface follows V0.3's overlay readability rule — an effectively opaque
* `surface-overlay` with a hairline border and the restrained `shadow-overlay`,
* never a translucent menu over chart noise.
*/
const menuContentClass = cn("z-[var(--z-popover)] min-w-[10rem] overflow-hidden rounded-lg border border-line-default bg-surface-overlay p-1 text-fg-primary luc-float", "data-[state=open]:animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]");
/**
* One row. `inset` aligns a row that has no leading indicator with rows that
* do — the classic menu alignment problem, solved once.
*/
function menuItemClass({ variant = "default", inset = false } = {}) {
	return cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-label outline-none luc-transition", "[&_svg]:size-4 [&_svg]:shrink-0", "data-[highlighted]:bg-surface-interactive-hover data-[highlighted]:text-fg-primary data-[highlighted]:shadow-xs", "active:bg-surface-interactive-active active:shadow-none", "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled", variant === "destructive" ? "text-fg-negative data-[highlighted]:bg-negative-soft data-[highlighted]:text-fg-negative" : "text-fg-secondary", inset && "pl-8");
}
const menuLabelClass = (inset = false) => cn("px-2 pt-1.5 pb-1 text-micro font-medium text-fg-muted uppercase", inset && "pl-8");
const menuSeparatorClass = "-mx-1 my-1 h-px bg-line-subtle";
/** The trailing keyboard hint. Purely presentational — never the trigger's name. */
function MenuShortcut({ className, children }) {
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "menu-shortcut",
		className: cn("ml-auto pl-4 font-mono text-micro text-fg-muted", className),
		children
	});
}
/**
* The children one menu row hands to its Radix `Item`.
*
* Always **one** value. Radix's `asChild` uses `Slot`, which demands exactly one
* child element (`React.Children.count(children) === 1`); a row that appended a
* conditional sibling — `{children}{shortcut ? … : null}` — was therefore two
* children even with no shortcut, and `asChild` threw
* "Primitive.div failed to slot onto its children". Luc Web hit it on the locale
* switch, where each item is a `<Link asChild>`: opening the menu took the whole
* page to the error boundary.
*
* A shortcut is therefore never a *sibling*: without `asChild` the row is one
* fragment, and with `asChild` the hint is cloned **into** the caller's child
* (which `Slot` then merges the row's own props onto). Either way the count is
* one, and the element the caller wrote stays the element that renders.
*/
function withTrailing(children, trailing, asChild = false) {
	if (trailing === null || trailing === void 0 || trailing === false) return children;
	if (asChild && isValidElement(children)) {
		const element = children;
		return cloneElement(element, void 0, element.props.children, trailing);
	}
	return /* @__PURE__ */ jsxs(Fragment, { children: [children, trailing] });
}
/** A row's own children plus its optional trailing shortcut hint. */
function menuRowChildren(children, shortcut, asChild = false) {
	return withTrailing(children, shortcut === null || shortcut === void 0 || shortcut === false ? null : /* @__PURE__ */ jsx(MenuShortcut, { children: shortcut }), asChild);
}
/**
* The leading slot for a checkbox or radio row. The indicator element is the
* consumer's `ItemIndicator`; this is only its box, so both menus align.
*/
function menuIndicatorClass(className) {
	return cn("pointer-events-none absolute left-2 grid size-4 place-items-center text-fg-accent", className);
}
//#endregion
export { MenuShortcut, menuContentClass, menuIndicatorClass, menuItemClass, menuLabelClass, menuRowChildren, menuSeparatorClass, withTrailing };

//# sourceMappingURL=menu-shared.js.map