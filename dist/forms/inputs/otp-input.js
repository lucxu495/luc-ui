"use client";
import { cn } from "../../utils/cn.js";
import { useField } from "../../components/field.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { OTPInput, REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
//#region src/forms/inputs/otp-input.tsx
const MODE_PATTERN = {
	numeric: REGEXP_ONLY_DIGITS,
	alphanumeric: REGEXP_ONLY_DIGITS_AND_CHARS,
	alpha: REGEXP_ONLY_CHARS
};
const slotSize = {
	sm: "h-control-sm w-7 rounded-sm text-label",
	md: "h-control-md w-9 rounded-md text-body",
	lg: "h-control-lg w-11 rounded-md text-title"
};
function Slot({ char, isActive, hasFakeCaret, size, disabled, invalid }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "otp-slot",
		"data-active": isActive || void 0,
		"data-filled": Boolean(char) || void 0,
		className: cn("relative grid place-items-center border bg-surface-sunken", "border-line-default text-fg-primary shadow-xs luc-transition luc-numeric", "data-[filled]:bg-surface-default", "data-[active]:border-line-accent data-[active]:shadow-[var(--glow-focus)]", invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]", disabled && "cursor-not-allowed opacity-60", slotSize[size]),
		children: [char ? /* @__PURE__ */ jsx("span", { children: char }) : null, hasFakeCaret && isActive && !disabled ? /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			"data-motion-essential": true,
			className: cn("pointer-events-none absolute h-4 w-px bg-fg-accent", "motion-safe:animate-[luc-pulse-soft_1.1s_ease-in-out_infinite]")
		}) : null]
	});
}
/**
* The OTP control. It renders real, individually visible slots on top of one
* hidden input, so screen readers hear a single "one-time code" field rather
* than six unlabelled boxes.
*/
function OtpInput({ length = 6, value, defaultValue, onValueChange, onComplete, mode = "numeric", size = "md", invalid, disabled, groups, className, id, name, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	const groupSize = groups ?? [length];
	const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
	const current = value ?? uncontrolled;
	const renderSlots = (renderProps) => {
		let cursor = 0;
		return /* @__PURE__ */ jsx("div", {
			className: "flex items-center gap-2",
			children: groupSize.map((groupLength, groupIndex) => {
				const group = renderProps.slots.slice(cursor, cursor + groupLength);
				cursor += groupLength;
				return /* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-1.5",
					children: group.map((slot, slotIndex) => /* @__PURE__ */ jsx(Slot, {
						char: slot.char,
						isActive: slot.isActive,
						hasFakeCaret: slot.hasFakeCaret,
						size,
						disabled: Boolean(disabled ?? field.disabled),
						invalid: isInvalid
					}, `${groupIndex}-${slotIndex}`))
				}, groupIndex);
			})
		});
	};
	return /* @__PURE__ */ jsx(OTPInput, {
		"data-slot": "otp-input",
		maxLength: length,
		value: current,
		onChange: (next) => {
			if (value === void 0) setUncontrolled(next);
			onValueChange?.(next);
		},
		onComplete,
		pattern: MODE_PATTERN[mode],
		inputMode: mode === "numeric" ? "numeric" : "text",
		disabled: disabled ?? field.disabled,
		id: id ?? field.id,
		name,
		"aria-label": props["aria-label"],
		"aria-invalid": isInvalid || void 0,
		"aria-describedby": field.describedBy,
		autoComplete: "one-time-code",
		containerClassName: cn("group/otp flex items-center", className),
		render: renderSlots
	});
}
//#endregion
export { OtpInput };

//# sourceMappingURL=otp-input.js.map