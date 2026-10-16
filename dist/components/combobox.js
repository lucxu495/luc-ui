"use client";
import { cn } from "../utils/cn.js";
import { mergeRefs } from "../utils/refs.js";
import { useField } from "./field.js";
import { controlIconSizeClass, inputAdornmentClass } from "./input.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { RiCloseLine, RiExpandUpDownLine, RiLoader4Line, RiSearchLine } from "@remixicon/react";
import { useCombobox } from "downshift";
//#region src/components/combobox.tsx
function defaultFilter(option, query) {
	const needle = query.trim().toLowerCase();
	if (!needle) return true;
	return option.label.toLowerCase().includes(needle) || (option.description?.toLowerCase().includes(needle) ?? false);
}
const sizeStyles = {
	sm: {
		shell: "h-control-sm rounded-sm text-label",
		pad: "pl-7 pr-8"
	},
	md: {
		shell: "h-control-md rounded-md text-label",
		pad: "pl-8 pr-9"
	},
	lg: {
		shell: "h-control-lg rounded-md text-body",
		pad: "pl-9 pr-10"
	}
};
function Combobox({ options, value, onValueChange, inputValue, onInputValueChange, filter = defaultFilter, placeholder = "Search…", emptyMessage = "No matches", loading = false, disabled = false, clearable = true, clearLabel = "Clear selection", openLabel = "Open options", closeLabel = "Close options", size = "md", id, name, className, maxHeight = "17rem", renderOption, ...rest }) {
	const field = useField();
	const generatedId = useId();
	const inputId = id ?? field.id ?? `combobox-${generatedId}`;
	const wrapperRef = useRef(null);
	const inputRef = useRef(null);
	const resolvedSize = sizeStyles[size];
	const [localQuery, setLocalQuery] = useState("");
	const query = inputValue ?? localQuery;
	const items = useMemo(() => options.filter((option) => filter(option, query)), [
		filter,
		options,
		query
	]);
	const { isOpen, highlightedIndex, selectedItem, getInputProps, getItemProps, getMenuProps, getToggleButtonProps, closeMenu, openMenu, selectItem, setInputValue: setComboboxInputValue } = useCombobox({
		items,
		itemToString: (item) => item?.label ?? "",
		isItemDisabled: (item) => item.disabled === true,
		selectedItem: value ?? null,
		inputValue: query,
		initialSelectedItem: value ?? null,
		defaultHighlightedIndex: 0,
		onSelectedItemChange: ({ selectedItem: next }) => {
			const label = next?.label ?? "";
			if (inputRef.current) inputRef.current.value = label;
			onValueChange?.(next ?? null);
		},
		onIsOpenChange: ({ isOpen: open }) => {
			if (open) return;
			if (inputValue !== void 0) return;
			setLocalQuery("");
			if (inputRef.current) inputRef.current.value = (selectedItem ?? value ?? null)?.label ?? "";
		},
		onInputValueChange: ({ inputValue: next, type }) => {
			if (next === void 0) return;
			const typed = type === useCombobox.stateChangeTypes.InputChange;
			if (inputValue === void 0) setLocalQuery(typed ? next : "");
			if (typed) onInputValueChange?.(next);
		},
		stateReducer: (state, actionAndChanges) => {
			const { type, changes } = actionAndChanges;
			switch (type) {
				case useCombobox.stateChangeTypes.InputChange: return {
					...changes,
					isOpen: true
				};
				case useCombobox.stateChangeTypes.InputBlur: return {
					...changes,
					isOpen: state.isOpen
				};
				case useCombobox.stateChangeTypes.InputClick: return {
					...changes,
					isOpen: true
				};
				default: return changes;
			}
		}
	});
	useEffect(() => {
		if (inputValue === void 0 || !inputRef.current) return;
		if (inputRef.current.value !== inputValue) inputRef.current.value = inputValue;
	}, [inputValue]);
	useEffect(() => {
		if (!isOpen) return;
		const onPointerDown = (event) => {
			if (!wrapperRef.current?.contains(event.target)) closeMenu();
		};
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [closeMenu, isOpen]);
	const clear = () => {
		selectItem(null);
		setComboboxInputValue("");
		if (inputValue === void 0) setLocalQuery("");
		if (inputRef.current) inputRef.current.value = "";
		onValueChange?.(null);
		onInputValueChange?.("");
		openMenu();
	};
	const showClear = clearable && !disabled && (selectedItem || query.length > 0);
	const { value: _downshiftValue, ref: downshiftInputRef, ...inputProps } = getInputProps({
		id: inputId,
		name,
		disabled,
		placeholder,
		onFocus: (event) => {
			if (query.length === 0) event.currentTarget.select();
		},
		onClick: (event) => {
			if (query.length === 0) event.currentTarget.select();
		},
		"aria-label": rest["aria-label"],
		"aria-describedby": field.describedBy,
		"aria-invalid": field.invalid || void 0,
		className: cn("peer h-full w-full min-w-0 bg-transparent text-inherit outline-none", "placeholder:text-fg-disabled disabled:cursor-not-allowed disabled:text-fg-disabled", resolvedSize.pad)
	});
	/** Consecutive options sharing a `group` render under one header. */
	const grouped = useMemo(() => {
		const out = [];
		items.forEach((option, index) => {
			const last = out[out.length - 1];
			if (last && last.label === option.group) last.entries.push({
				option,
				index
			});
			else out.push({
				label: option.group,
				entries: [{
					option,
					index
				}]
			});
		});
		return out;
	}, [items]);
	return /* @__PURE__ */ jsxs("div", {
		ref: wrapperRef,
		className: cn("relative w-full", className),
		onBlur: (event) => {
			if (!wrapperRef.current?.contains(event.relatedTarget)) closeMenu();
		},
		children: [/* @__PURE__ */ jsxs("div", {
			"data-slot": "combobox-shell",
			"data-size": size,
			className: cn("group/combobox relative flex w-full items-center", "border border-line-default bg-surface-sunken text-fg-primary shadow-well", "luc-transition", "hover:border-line-strong hover:shadow-rest", "focus-within:border-line-accent focus-within:shadow-[var(--glow-focus)]", "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-line-subtle has-[:disabled]:shadow-none", field.invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]", resolvedSize.shell),
			children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn(inputAdornmentClass, "absolute top-1/2 -translate-y-1/2", "group-focus-within/combobox:text-fg-accent", size === "sm" ? "left-2" : size === "md" ? "left-2.5" : "left-3", controlIconSizeClass[size]),
					children: loading ? /* @__PURE__ */ jsx(RiLoader4Line, {
						className: "luc-spinner",
						"data-motion-essential": ""
					}) : /* @__PURE__ */ jsx(RiSearchLine, {})
				}),
				/* @__PURE__ */ jsx("input", {
					ref: mergeRefs(inputRef, downshiftInputRef),
					defaultValue: value?.label ?? "",
					...inputProps
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5",
					children: [showClear ? /* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": clearLabel,
						onMouseDown: (event) => event.preventDefault(),
						onClick: clear,
						className: cn("grid size-6 place-items-center rounded-xs text-fg-muted luc-transition", "hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus"),
						children: /* @__PURE__ */ jsx(RiCloseLine, {
							"aria-hidden": "true",
							className: "size-3.5"
						})
					}) : null, /* @__PURE__ */ jsx("button", {
						...getToggleButtonProps({
							"aria-label": isOpen ? closeLabel : openLabel,
							disabled,
							tabIndex: -1,
							className: cn("grid size-6 place-items-center rounded-xs text-fg-muted luc-transition", "hover:text-fg-primary")
						}),
						children: /* @__PURE__ */ jsx(RiExpandUpDownLine, {
							"aria-hidden": "true",
							className: "size-3.5"
						})
					})]
				})
			]
		}), /* @__PURE__ */ jsxs("ul", {
			...getMenuProps({ "aria-label": rest["aria-label"] ? `${rest["aria-label"]} options` : "Options" }),
			style: { maxHeight },
			className: cn("absolute top-[calc(100%+0.375rem)] left-0 w-full overflow-y-auto overscroll-contain", "z-[var(--z-popover)] rounded-lg border border-line-default bg-surface-overlay p-1 luc-float", "origin-top", isOpen ? "animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]" : "pointer-events-none invisible"),
			children: [
				isOpen && loading && items.length === 0 ? /* @__PURE__ */ jsxs("li", {
					className: "flex items-center gap-2 px-2 py-2 text-caption text-fg-muted",
					children: [/* @__PURE__ */ jsx(RiLoader4Line, {
						"aria-hidden": "true",
						className: "luc-spinner size-3.5",
						"data-motion-essential": ""
					}), "Searching…"]
				}) : null,
				isOpen && !loading && items.length === 0 ? /* @__PURE__ */ jsx("li", {
					className: "px-2 py-2 text-caption text-fg-muted",
					children: emptyMessage
				}) : null,
				isOpen ? grouped.map((section, sectionIndex) => /* @__PURE__ */ jsxs("li", {
					role: "presentation",
					children: [section.label ? /* @__PURE__ */ jsx("p", {
						className: "px-2 pt-2 pb-1 text-micro font-medium text-fg-muted uppercase",
						children: section.label
					}) : null, /* @__PURE__ */ jsx("ul", {
						role: "presentation",
						children: section.entries.map(({ option, index }) => {
							const highlighted = highlightedIndex === index;
							const selected = selectedItem?.value === option.value;
							return /* @__PURE__ */ jsx("li", {
								...getItemProps({
									item: option,
									index,
									disabled: option.disabled,
									className: cn("flex cursor-default items-start gap-2 rounded-sm px-2 py-1.5 text-label", "text-fg-secondary luc-transition", highlighted && "bg-surface-interactive-hover text-fg-primary", selected && "text-fg-primary", option.disabled && "pointer-events-none text-fg-disabled")
								}),
								children: renderOption ? renderOption(option, {
									selected,
									highlighted
								}) : /* @__PURE__ */ jsxs(Fragment, { children: [
									option.leading ? /* @__PURE__ */ jsx("span", {
										"aria-hidden": "true",
										className: "grid size-4 shrink-0 place-items-center text-fg-muted",
										children: option.leading
									}) : null,
									/* @__PURE__ */ jsxs("span", {
										className: "flex min-w-0 flex-1 flex-col gap-0.5",
										children: [/* @__PURE__ */ jsx("span", {
											className: "truncate",
											children: option.label
										}), option.description ? /* @__PURE__ */ jsx("span", {
											className: "truncate text-caption text-fg-muted",
											children: option.description
										}) : null]
									}),
									selected ? /* @__PURE__ */ jsx("span", {
										className: "mt-1 size-1.5 rounded-full bg-accent-default",
										"aria-hidden": "true"
									}) : null
								] })
							}, option.value);
						})
					})]
				}, section.label ?? `section-${sectionIndex}`)) : null
			]
		})]
	});
}
//#endregion
export { Combobox };

//# sourceMappingURL=combobox.js.map