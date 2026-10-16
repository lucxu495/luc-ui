"use client";
import { useControllableState } from "../../hooks/use-controllable-state.js";
import { cn } from "../../utils/cn.js";
import { useField } from "../../components/field.js";
import { inputShellClass } from "../../components/input.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { RiCloseLine } from "@remixicon/react";
//#region src/forms/inputs/tag-input.tsx
const sizeClass = {
	sm: "min-h-control-sm rounded-sm px-1.5 py-1 text-label",
	md: "min-h-control-md rounded-md px-1.5 py-1 text-label",
	lg: "min-h-control-lg rounded-md px-2 py-1.5 text-body"
};
function TagInput({ value, defaultValue, onValueChange, placeholder = "Add a value…", maxTags, separators = [","], validate, caseSensitive = false, allowDuplicates = false, size = "md", invalid, disabled, readOnly, id, className, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	const isDisabled = disabled ?? field.disabled;
	const isReadOnly = readOnly ?? field.readOnly;
	const inputRef = useRef(null);
	const [draft, setDraft] = useState("");
	const [message, setMessage] = useState(void 0);
	const [tags, setTags] = useControllableState({
		value,
		defaultValue: defaultValue ?? [],
		onChange: onValueChange
	});
	const sameValue = (a, b) => caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();
	const commit = (raw) => {
		const candidate = raw.trim();
		if (!candidate) return;
		if (!allowDuplicates && tags.some((tag) => sameValue(tag, candidate))) {
			setMessage(`“${candidate}” is already in the list`);
			setDraft("");
			return;
		}
		const rejection = validate?.(candidate, tags);
		if (rejection) {
			setMessage(rejection);
			return;
		}
		if (maxTags !== void 0 && tags.length >= maxTags) {
			setMessage(`Up to ${maxTags} values`);
			return;
		}
		setTags([...tags, candidate]);
		setDraft("");
		setMessage(void 0);
	};
	/** Pasting a list is the common case — split it and take everything valid. */
	const commitPasted = (text) => {
		const parts = text.split(/[\n,;]+/).map((part) => part.trim()).filter(Boolean);
		if (parts.length <= 1) return false;
		let next = [...tags];
		let rejection;
		for (const part of parts) {
			if (!allowDuplicates && next.some((tag) => sameValue(tag, part))) continue;
			const invalidPart = validate?.(part, next);
			if (invalidPart) {
				rejection = invalidPart;
				continue;
			}
			if (maxTags !== void 0 && next.length >= maxTags) {
				rejection = `Up to ${maxTags} values`;
				break;
			}
			next = [...next, part];
		}
		setTags(next);
		setMessage(rejection);
		return true;
	};
	const handleKeyDown = (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			commit(draft);
			return;
		}
		if (separators.includes(event.key)) {
			event.preventDefault();
			commit(draft);
			return;
		}
		if (event.key === "Backspace" && draft === "" && tags.length > 0) {
			event.preventDefault();
			setTags(tags.slice(0, -1));
			setMessage(void 0);
			return;
		}
		if (event.key === "Escape") {
			setDraft("");
			setMessage(void 0);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-w-0 flex-col gap-1.5",
		children: [/* @__PURE__ */ jsxs("div", {
			"data-slot": "tag-input",
			"data-size": size,
			className: cn(inputShellClass, sizeClass[size], "flex-wrap items-center gap-1.5", isReadOnly && "border-dashed bg-surface-canvas", className),
			onClick: () => inputRef.current?.focus(),
			children: [tags.map((tag) => /* @__PURE__ */ jsxs("span", {
				className: "inline-flex h-5 items-center gap-1 rounded-xs bg-accent-soft pr-0.5 pl-2 text-caption text-fg-accent",
				children: [/* @__PURE__ */ jsx("span", {
					className: "max-w-[18ch] truncate",
					children: tag
				}), !isDisabled && !isReadOnly ? /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": `Remove ${tag}`,
					onClick: (event) => {
						event.stopPropagation();
						setTags(tags.filter((current) => current !== tag));
					},
					className: "luc-transition luc-hit grid size-4 place-items-center rounded-xs text-fg-accent hover:bg-accent-soft-hover luc-focus",
					children: /* @__PURE__ */ jsx(RiCloseLine, {
						"aria-hidden": "true",
						className: "size-3"
					})
				}) : null]
			}, tag)), /* @__PURE__ */ jsx("input", {
				ref: inputRef,
				"data-slot": "tag-input-element",
				id: id ?? field.id,
				value: draft,
				disabled: isDisabled,
				readOnly: isReadOnly,
				"aria-invalid": isInvalid || void 0,
				"aria-describedby": field.describedBy,
				"aria-label": props["aria-label"],
				onChange: (event) => {
					const next = event.target.value;
					if (separators.some((separator) => next.includes(separator))) {
						if (!commitPasted(next)) commit(next.replace(/[,;]+$/, ""));
						return;
					}
					setDraft(next);
					if (message) setMessage(void 0);
				},
				onKeyDown: handleKeyDown,
				onBlur: () => {
					if (draft.trim()) commit(draft);
				},
				onPaste: (event) => {
					const text = event.clipboardData.getData("text");
					if (commitPasted(text)) event.preventDefault();
				},
				placeholder: tags.length === 0 ? placeholder : void 0,
				className: cn("min-w-[8ch] flex-1 bg-transparent text-fg-primary outline-none", "placeholder:text-fg-muted disabled:cursor-not-allowed", size === "lg" ? "h-7" : "h-6")
			})]
		}), message ? /* @__PURE__ */ jsx("p", {
			role: "alert",
			className: "text-caption text-fg-negative",
			children: message
		}) : null]
	});
}
//#endregion
export { TagInput };

//# sourceMappingURL=tag-input.js.map