"use client";
import { useControllableState } from "../../hooks/use-controllable-state.js";
import { cn } from "../../utils/cn.js";
import { formatBytes } from "../../utils/format.js";
import { IconButton } from "../../components/icon-button.js";
import { Button as Button$1 } from "../../components/button-base.js";
import { useField } from "../../components/field.js";
import { DropZone, FileTrigger } from "react-aria-components";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { RiCloseLine, RiFileLine, RiUploadCloud2Line } from "@remixicon/react";
//#region src/forms/inputs/file-input.tsx
const REJECTION_MESSAGE = {
	type: "Unsupported file type",
	size: "File is too large",
	count: "Too many files"
};
/** Matches `.csv`, `image/*` and `application/json` against a file. */
function matchesAccept(file, accept) {
	if (!accept || accept.length === 0) return true;
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	return accept.some((pattern) => {
		const rule = pattern.trim().toLowerCase();
		if (!rule) return false;
		if (rule.startsWith(".")) return name.endsWith(rule);
		if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
		return type === rule;
	});
}
function FileInput({ value, defaultValue, onFilesChange, onReject, accept, multiple = false, maxSize, maxFiles, disabled, invalid, variant = "compact", hint, label, id, className, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	const isDisabled = disabled ?? field.disabled;
	const listId = useId();
	const [files, setFiles] = useControllableState({
		value,
		defaultValue: defaultValue ?? [],
		onChange: onFilesChange
	});
	const [rejections, setRejections] = useControllableState({
		defaultValue: [],
		onChange: onReject
	});
	/** Validate, then commit. Every rejection is reported, never swallowed. */
	const acceptFiles = (incoming) => {
		const rejected = [];
		const accepted = [];
		const limit = maxFiles ?? (multiple ? Number.POSITIVE_INFINITY : 1);
		for (const file of incoming) {
			if (!matchesAccept(file, accept)) {
				rejected.push({
					file,
					reason: "type"
				});
				continue;
			}
			if (maxSize !== void 0 && file.size > maxSize) {
				rejected.push({
					file,
					reason: "size"
				});
				continue;
			}
			accepted.push(file);
		}
		const merged = [...multiple ? files : [], ...accepted].filter((file, index, all) => all.findIndex((other) => other.name === file.name && other.size === file.size) === index);
		const kept = merged.slice(0, limit);
		for (const overflow of merged.slice(limit)) rejected.push({
			file: overflow,
			reason: "count"
		});
		setFiles(kept);
		setRejections(rejected);
	};
	const removeFile = (target) => {
		setFiles(files.filter((file) => file !== target));
	};
	const picker = /* @__PURE__ */ jsx(FileTrigger, {
		acceptedFileTypes: accept,
		allowsMultiple: multiple,
		onSelect: (selected) => acceptFiles(selected ? Array.from(selected) : []),
		children: /* @__PURE__ */ jsx(Button$1, {
			id: id ?? field.id,
			variant: variant === "dropzone" ? "secondary" : "outline",
			size: "sm",
			disabled: isDisabled,
			type: "button",
			"aria-describedby": field.describedBy,
			"aria-invalid": isInvalid || void 0,
			children: variant === "dropzone" ? "Choose files" : "Browse…"
		})
	});
	const list = files.length > 0 ? /* @__PURE__ */ jsx("ul", {
		id: listId,
		className: "flex min-w-0 flex-col gap-1",
		children: files.map((file) => /* @__PURE__ */ jsxs("li", {
			className: "flex items-center gap-2 rounded-sm border border-line-subtle bg-surface-sunken px-2 py-1.5",
			children: [
				/* @__PURE__ */ jsx(RiFileLine, {
					"aria-hidden": "true",
					className: "size-4 shrink-0 text-fg-muted"
				}),
				/* @__PURE__ */ jsx("span", {
					className: "min-w-0 flex-1 truncate text-label text-fg-secondary",
					children: file.name
				}),
				/* @__PURE__ */ jsx("span", {
					className: "shrink-0 text-caption text-fg-muted luc-numeric",
					children: formatBytes(file.size)
				}),
				/* @__PURE__ */ jsx(IconButton, {
					label: `Remove ${file.name}`,
					variant: "ghost",
					size: "sm",
					disabled: isDisabled,
					onClick: () => removeFile(file),
					icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
					className: "-mr-1"
				})
			]
		}, `${file.name}-${file.size}-${file.lastModified}`))
	}) : null;
	const rejectionList = rejections.length > 0 ? /* @__PURE__ */ jsx("ul", {
		className: "flex flex-col gap-1 text-caption text-fg-negative",
		children: rejections.map((rejection) => /* @__PURE__ */ jsxs("li", {
			className: "flex items-start gap-1.5",
			children: [/* @__PURE__ */ jsx(RiCloseLine, {
				"aria-hidden": "true",
				className: "mt-0.5 size-3.5 shrink-0"
			}), /* @__PURE__ */ jsxs("span", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "font-medium",
					children: rejection.file.name
				}),
				" — ",
				REJECTION_MESSAGE[rejection.reason],
				rejection.reason === "size" && maxSize ? ` (limit ${formatBytes(maxSize)})` : null
			] })]
		}, `${rejection.file.name}-${rejection.reason}`))
	}) : null;
	if (variant === "dropzone") return /* @__PURE__ */ jsxs("div", {
		"data-slot": "file-input",
		className: cn("flex min-w-0 flex-col gap-2", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs(DropZone, {
				isDisabled,
				onDrop: async (event) => {
					const dropped = [];
					for (const item of event.items) if (item.kind === "file") dropped.push(await item.getFile());
					if (dropped.length > 0) acceptFiles(dropped);
				},
				className: ({ isDropTarget }) => cn("flex min-w-0 flex-col items-center gap-2.5 rounded-lg border border-dashed px-5 py-6 text-center luc-transition", "border-line-default bg-surface-sunken", !isDisabled && "hover:border-line-strong hover:bg-surface-interactive", isDropTarget && "border-line-accent bg-accent-soft", isInvalid && "border-negative"),
				children: [
					/* @__PURE__ */ jsx(RiUploadCloud2Line, {
						"aria-hidden": "true",
						className: "size-6 text-fg-muted"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-col gap-0.5",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-label font-medium text-fg-secondary",
							children: "Drop files here"
						}), hint ? /* @__PURE__ */ jsx("p", {
							className: "text-caption text-fg-muted",
							children: hint
						}) : null]
					}),
					picker
				]
			}),
			list,
			rejectionList
		]
	});
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "file-input",
		className: cn("flex min-w-0 flex-col gap-2", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: cn("flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-line-default bg-surface-sunken px-2 py-1.5 shadow-xs", isInvalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]"),
				children: [picker, /* @__PURE__ */ jsx("span", {
					className: "min-w-0 flex-1 truncate text-caption text-fg-muted",
					children: files.length === 0 ? label ?? hint ?? "No file selected" : `${files.length} file${files.length === 1 ? "" : "s"} selected`
				})]
			}),
			list,
			rejectionList
		]
	});
}
/**
* The explicit drag-and-drop surface. Same component, larger vocabulary — the
* compact `FileInput` is the default because a giant dashed rectangle is a
* layout decision, not a file-input decision.
*/
function DropZone$1(props) {
	return /* @__PURE__ */ jsx(FileInput, {
		...props,
		variant: "dropzone"
	});
}
//#endregion
export { DropZone$1 as DropZone, FileInput };

//# sourceMappingURL=file-input.js.map