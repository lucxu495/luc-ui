"use client";
import { cn } from "../utils/cn.js";
import { Input } from "./input.js";
import { jsx } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { RiSearchLine } from "@remixicon/react";
//#region src/components/search-input.tsx
/**
* Search field with a clear affordance. The clear button is a real button so
* keyboard users can reach it, and it restores focus to the field.
*/
function SearchInput({ className, onValueChange, clearable = true, clearLabel = "Clear search", value, defaultValue, onChange, ref, ...props }) {
	const inputRef = useRef(null);
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
	const currentValue = value ?? uncontrolledValue;
	const handleChange = (event) => {
		if (value === void 0) setUncontrolledValue(event.target.value);
		onChange?.(event);
		onValueChange?.(event.target.value);
	};
	const clear = () => {
		const input = inputRef.current;
		if (value === void 0) setUncontrolledValue("");
		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
		if (input && nativeInputValueSetter) {
			nativeInputValueSetter.call(input, "");
			input.dispatchEvent(new Event("input", { bubbles: true }));
		}
		input?.focus();
	};
	const ariaLabel = props["aria-label"] ?? (typeof props.placeholder === "string" && props.placeholder.length > 0 ? props.placeholder : "Search");
	return /* @__PURE__ */ jsx(Input, {
		ref: (node) => {
			inputRef.current = node;
			if (typeof ref === "function") ref(node);
			else if (ref) ref.current = node;
		},
		type: "search",
		inputMode: "search",
		autoComplete: "off",
		spellCheck: false,
		"aria-label": ariaLabel,
		value,
		defaultValue,
		onChange: handleChange,
		leadingIcon: /* @__PURE__ */ jsx(RiSearchLine, {}),
		trailingAction: clearable && String(currentValue).length > 0 ? /* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": clearLabel,
			onClick: clear,
			className: cn("luc-transition luc-hit grid size-5 place-items-center rounded-xs text-fg-muted", "hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus"),
			children: /* @__PURE__ */ jsx("svg", {
				viewBox: "0 0 16 16",
				className: "size-3",
				"aria-hidden": "true",
				children: /* @__PURE__ */ jsx("path", {
					d: "M4.5 4.5l7 7m0-7l-7 7",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round",
					fill: "none"
				})
			})
		}) : null,
		className,
		...props
	});
}
//#endregion
export { SearchInput };

//# sourceMappingURL=search-input.js.map