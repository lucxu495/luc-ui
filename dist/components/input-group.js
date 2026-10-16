import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/input-group.tsx
const sizeClass = {
	sm: "h-control-sm rounded-sm px-2.5 text-label",
	md: "h-control-md rounded-md px-3 text-label",
	lg: "h-control-lg rounded-md px-4 text-body"
};
function InputGroup({ className, size = "md", invalid, disabled, children, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "input-group",
		"data-size": size,
		"data-disabled": disabled || void 0,
		"data-invalid": invalid || void 0,
		className: cn("group/input-group relative flex w-full items-center gap-2", "border border-line-default bg-surface-sunken text-fg-primary shadow-well luc-transition", "focus-within:border-line-accent", "focus-within:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]", "hover:border-line-strong hover:bg-surface-interactive hover:shadow-rest", "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-line-subtle has-[:disabled]:bg-surface-sunken has-[:disabled]:shadow-none", invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]", sizeClass[size], className),
		...props,
		children
	});
}
function InputGroupAddon({ className, align = "start", interactive = false, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "input-group-addon",
		"data-align": align,
		className: cn("flex shrink-0 items-center gap-1.5 text-fg-muted", "[&_svg]:size-4 [&_svg]:shrink-0", interactive && "cursor-pointer text-fg-secondary luc-transition hover:text-fg-primary", className),
		...props
	});
}
function InputGroupInput({ className, ...props }) {
	return /* @__PURE__ */ jsx("input", {
		"data-slot": "input-group-input",
		className: cn("peer h-full w-full min-w-0 flex-1 bg-transparent text-inherit outline-none", "placeholder:text-fg-disabled disabled:cursor-not-allowed disabled:text-fg-disabled", className),
		...props
	});
}
/** A hairline between the value and an adjacent element inside the shell. */
function InputGroupSeparator({ className, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		role: "separator",
		"aria-orientation": "vertical",
		"data-slot": "input-group-separator",
		className: cn("my-1 w-px shrink-0 self-stretch bg-line-subtle", className),
		...props
	});
}
//#endregion
export { InputGroup, InputGroupAddon, InputGroupInput, InputGroupSeparator };

//# sourceMappingURL=input-group.js.map