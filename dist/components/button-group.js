"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { Toolbar } from "radix-ui";
//#region src/components/button-group.tsx
function ButtonGroup({ className, vertical = false, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "button-group",
		role: "group",
		className: cn("inline-flex", vertical ? "flex-col" : "flex-row", "[&>*]:relative [&>*]:z-0", "[&>*+*]:z-[1]", vertical ? "[&>*+*]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none" : "[&>*+*]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none", className),
		...props
	});
}
/** A hairline divider for a mixed group (a button, then a menu). */
function ButtonGroupSeparator({ className, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		role: "separator",
		"aria-orientation": "vertical",
		"data-slot": "button-group-separator",
		className: cn("mx-0.5 w-px shrink-0 self-stretch bg-line-subtle", className),
		...props
	});
}
/**
* A toolbar is one tab stop. `label` is required by the type because an unnamed
* `role="toolbar"` is a real accessibility defect, not a stylistic one.
*/
function Toolbar$1({ className, label, ...props }) {
	return /* @__PURE__ */ jsx(Toolbar.Root, {
		"data-slot": "toolbar",
		"aria-label": label,
		className: cn("flex items-center gap-1 rounded-lg border border-line-subtle bg-surface-default p-1 shadow-rest", className),
		...props
	});
}
const ToolbarButton = Toolbar.Button;
const ToolbarSeparator = Toolbar.Separator;
const ToolbarLink = Toolbar.Link;
const ToolbarToggleGroup = Toolbar.ToggleGroup;
const ToolbarToggleItem = Toolbar.ToggleItem;
//#endregion
export { ButtonGroup, ButtonGroupSeparator, Toolbar$1 as Toolbar, ToolbarButton, ToolbarLink, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem };

//# sourceMappingURL=button-group.js.map