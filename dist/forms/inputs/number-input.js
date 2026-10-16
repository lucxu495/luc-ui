"use client";
import { LocaleProvider } from "../../providers/locale-provider.js";
import { cn } from "../../utils/cn.js";
import { useField } from "../../components/field.js";
import { inputShellClass } from "../../components/input.js";
import { Button, Input, NumberField } from "react-aria-components";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/forms/inputs/number-input.tsx
const sizeClass = {
	sm: "h-control-sm rounded-sm text-label",
	md: "h-control-md rounded-md text-label",
	lg: "h-control-lg rounded-md text-body"
};
const stepperBtnClass = cn("grid h-full w-6 shrink-0 place-items-center text-fg-muted luc-transition", "hover:bg-surface-interactive-hover hover:text-fg-primary", "disabled:pointer-events-none disabled:opacity-40", "focus-visible:bg-surface-interactive-hover focus-visible:text-fg-primary focus-visible:outline-none", "[&_svg]:size-3.5");
/**
* The base number control. `CurrencyInput` and `PercentageInput` are the two
* unit contracts products ask for most; both are built on this one.
*/
function NumberInput({ value, defaultValue, onValueChange, onBlur, min, max, step, formatOptions, decimals, locale, size = "md", unit, leadingIcon, steppers = true, invalid, disabled, readOnly, required, placeholder, name, id, isWheelDisabled = true, commitBehavior = "snap", className, inputClassName, incrementAriaLabel, decrementAriaLabel, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	const resolvedFormat = decimals === void 0 ? formatOptions : {
		...formatOptions,
		minimumFractionDigits: formatOptions?.minimumFractionDigits ?? decimals,
		maximumFractionDigits: formatOptions?.maximumFractionDigits ?? decimals
	};
	return /* @__PURE__ */ jsx(LocaleProvider, {
		locale,
		children: /* @__PURE__ */ jsxs(NumberField, {
			"data-slot": "number-input",
			"data-size": size,
			value: value ?? void 0,
			defaultValue: defaultValue ?? void 0,
			onChange: (next) => onValueChange?.(Number.isNaN(next) ? null : next),
			onBlur,
			minValue: min,
			maxValue: max,
			step,
			formatOptions: resolvedFormat,
			isInvalid,
			isDisabled: disabled ?? field.disabled,
			isReadOnly: readOnly ?? field.readOnly,
			isRequired: required ?? field.required,
			isWheelDisabled,
			commitBehavior,
			name,
			id: id ?? field.id,
			"aria-label": props["aria-label"],
			"aria-describedby": field.describedBy,
			"aria-labelledby": field.labelId,
			incrementAriaLabel,
			decrementAriaLabel,
			className: cn(inputShellClass, sizeClass[size], "overflow-hidden p-0", className),
			children: [
				leadingIcon ? /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: "grid size-4 shrink-0 place-items-center pl-2.5 text-fg-muted",
					children: leadingIcon
				}) : null,
				steppers ? /* @__PURE__ */ jsx(Button, {
					slot: "decrement",
					className: cn(stepperBtnClass, "border-r border-line-subtle"),
					children: /* @__PURE__ */ jsx("svg", {
						viewBox: "0 0 16 16",
						"aria-hidden": "true",
						children: /* @__PURE__ */ jsx("path", {
							d: "M4 8h8",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							fill: "none"
						})
					})
				}) : null,
				/* @__PURE__ */ jsx(Input, {
					"data-slot": "number-input-element",
					placeholder,
					className: cn("w-full min-w-0 bg-transparent px-2.5 text-right text-fg-primary outline-none", "luc-numeric placeholder:text-fg-muted", inputClassName)
				}),
				unit ? /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: "shrink-0 pr-2.5 text-caption text-fg-muted",
					children: unit
				}) : null,
				steppers ? /* @__PURE__ */ jsx(Button, {
					slot: "increment",
					className: cn(stepperBtnClass, "border-l border-line-subtle"),
					children: /* @__PURE__ */ jsx("svg", {
						viewBox: "0 0 16 16",
						"aria-hidden": "true",
						children: /* @__PURE__ */ jsx("path", {
							d: "M8 4v8M4 8h8",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							fill: "none"
						})
					})
				}) : null
			]
		})
	});
}
/**
* A number field bound to a currency *format*, not to a currency *policy*.
* The value is the major unit as a plain number (`1234.5` renders `$1,234.50`).
*/
function CurrencyInput({ currency, decimals = 2, ...props }) {
	return /* @__PURE__ */ jsx(NumberInput, {
		...props,
		decimals,
		formatOptions: {
			style: "currency",
			currency
		}
	});
}
/**
* A percentage field with an explicit unit contract.
*
* `scale` is required because "0.12" is ambiguous, and a silent unit
* conversion is how a 12% allocation becomes a 0.12% one. The component
* converts only between the canonical value and the display value — the
* consumer's stored value never changes meaning.
*/
function PercentageInput({ scale, step, decimals = 1, value, defaultValue, onValueChange, ...props }) {
	const toDisplay = (canonical) => canonical === null || canonical === void 0 ? null : scale === "fraction" ? canonical : canonical / 100;
	const toCanonical = (display) => display === null ? null : scale === "fraction" ? display : display * 100;
	return /* @__PURE__ */ jsx(NumberInput, {
		...props,
		value: toDisplay(value),
		defaultValue: toDisplay(defaultValue) ?? void 0,
		onValueChange: (display) => onValueChange?.(toCanonical(display)),
		step,
		decimals,
		formatOptions: { style: "percent" }
	});
}
//#endregion
export { CurrencyInput, NumberInput, PercentageInput };

//# sourceMappingURL=number-input.js.map