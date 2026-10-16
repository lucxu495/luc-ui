"use client";
import { cn } from "../utils/cn.js";
import { formatBytes } from "../utils/format.js";
import { IconButton } from "./icon-button.js";
import { Text } from "../typography.js";
import { Button } from "./button-base.js";
import { Progress } from "./progress.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useId, useRef, useState } from "react";
import { RiAlertLine, RiCheckLine, RiCloseLine, RiFileLine, RiRefreshLine, RiUploadCloud2Line } from "@remixicon/react";
//#region src/components/file-upload.tsx
const STATUS_LABEL = {
	queued: "Waiting",
	uploading: "Uploading",
	done: "Uploaded",
	error: "Failed"
};
function matchesAccept(file, accept) {
	if (!accept) return true;
	const patterns = accept.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean);
	if (patterns.length === 0) return true;
	const name = file.name.toLowerCase();
	const type = (file.type || "").toLowerCase();
	return patterns.some((pattern) => {
		if (pattern.startsWith(".")) return name.endsWith(pattern);
		if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1));
		return type === pattern;
	});
}
function FileUpload({ items, onFiles, onReject, onRemove, onRetry, accept, multiple = true, maxSize, maxFiles, title = "Drop files here", inputLabel, hint, disabled = false, listLabel = "Selected files", footer, className, ...props }) {
	const inputId = useId();
	const inputRef = useRef(null);
	const [dragging, setDragging] = useState(0);
	const accept_ = useCallback((incoming) => {
		const rejections = [];
		const accepted = [];
		const limit = maxFiles ?? Number.POSITIVE_INFINITY;
		incoming.forEach((file, index) => {
			if (index >= limit) {
				rejections.push({
					file,
					reason: "count",
					message: `Only ${limit} files can be added at once.`
				});
				return;
			}
			if (!matchesAccept(file, accept)) {
				rejections.push({
					file,
					reason: "type",
					message: `${file.name} is not an accepted file type.`
				});
				return;
			}
			if (maxSize !== void 0 && file.size > maxSize) {
				rejections.push({
					file,
					reason: "size",
					message: `${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(maxSize)}.`
				});
				return;
			}
			accepted.push(file);
		});
		if (rejections.length > 0) onReject?.(rejections);
		if (accepted.length > 0) onFiles(accepted);
	}, [
		accept,
		maxFiles,
		maxSize,
		onFiles,
		onReject
	]);
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "file-upload",
		className: cn("flex flex-col gap-3", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("div", {
				"data-slot": "file-upload-dropzone",
				"data-dragging": dragging > 0 ? "true" : void 0,
				onDragEnter: (event) => {
					if (disabled) return;
					event.preventDefault();
					setDragging((count) => count + 1);
				},
				onDragOver: (event) => {
					if (disabled) return;
					event.preventDefault();
				},
				onDragLeave: () => setDragging((count) => Math.max(count - 1, 0)),
				onDrop: (event) => {
					if (disabled) return;
					event.preventDefault();
					setDragging(0);
					accept_(Array.from(event.dataTransfer.files));
				},
				className: cn("luc-transition relative flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-7 text-center", "border-line-default bg-surface-sunken luc-well", "data-[dragging=true]:border-line-accent data-[dragging=true]:bg-surface-selected", disabled && "opacity-60"),
				children: [
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "grid size-9 place-items-center rounded-full bg-surface-interactive text-fg-accent",
						children: /* @__PURE__ */ jsx(RiUploadCloud2Line, { className: "size-4.5" })
					}),
					/* @__PURE__ */ jsx(Text, {
						variant: "label",
						className: "text-fg-primary",
						children: title
					}),
					hint ? /* @__PURE__ */ jsx(Text, {
						variant: "caption",
						tone: "muted",
						children: hint
					}) : null,
					/* @__PURE__ */ jsx(Button, {
						type: "button",
						variant: "secondary",
						size: "sm",
						disabled,
						onClick: () => inputRef.current?.click(),
						className: "mt-1",
						children: "Browse files"
					}),
					/* @__PURE__ */ jsx("input", {
						ref: inputRef,
						id: inputId,
						type: "file",
						"aria-label": inputLabel ?? title,
						className: "sr-only",
						accept,
						multiple,
						disabled,
						onChange: (event) => {
							accept_(Array.from(event.target.files ?? []));
							event.target.value = "";
						}
					})
				]
			}),
			items.length > 0 ? /* @__PURE__ */ jsx("ul", {
				"data-slot": "file-upload-list",
				"aria-label": listLabel,
				className: "flex flex-col gap-2",
				children: items.map((item) => /* @__PURE__ */ jsxs("li", {
					className: "luc-transition flex items-start gap-3 rounded-md border border-line-subtle bg-surface-default p-3 luc-rest",
					children: [
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm bg-surface-interactive", item.status === "error" ? "text-negative" : "text-fg-muted"),
							children: item.icon ?? /* @__PURE__ */ jsx(RiFileLine, { className: "size-4" })
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex min-w-0 flex-1 flex-col gap-1.5",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex min-w-0 items-center gap-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "min-w-0 flex-1 truncate text-label text-fg-primary",
										children: item.name
									}), /* @__PURE__ */ jsx("span", {
										className: "shrink-0 text-caption text-fg-muted luc-numeric",
										children: item.size !== void 0 ? formatBytes(item.size) : ""
									})]
								}),
								item.status === "uploading" ? /* @__PURE__ */ jsx(Progress, {
									value: item.progress ?? null,
									size: "sm",
									"aria-label": `Uploading ${item.name}`
								}) : null,
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-1.5 text-caption",
									children: [
										item.status === "done" ? /* @__PURE__ */ jsx(RiCheckLine, {
											"aria-hidden": "true",
											className: "size-3.5 text-positive"
										}) : null,
										item.status === "error" ? /* @__PURE__ */ jsx(RiAlertLine, {
											"aria-hidden": "true",
											className: "size-3.5 text-negative"
										}) : null,
										/* @__PURE__ */ jsx("span", {
											className: cn(item.status === "error" ? "text-negative" : item.status === "done" ? "text-positive" : "text-fg-muted"),
											children: item.error ?? STATUS_LABEL[item.status]
										})
									]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex shrink-0 items-center gap-1",
							children: [item.status === "error" && onRetry ? /* @__PURE__ */ jsx(IconButton, {
								variant: "ghost",
								size: "sm",
								label: `Retry ${item.name}`,
								icon: /* @__PURE__ */ jsx(RiRefreshLine, {}),
								onClick: () => onRetry(item.id)
							}) : null, onRemove ? /* @__PURE__ */ jsx(IconButton, {
								variant: "ghost",
								size: "sm",
								label: `Remove ${item.name}`,
								icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
								onClick: () => onRemove(item.id)
							}) : null]
						})
					]
				}, item.id))
			}) : null,
			footer
		]
	});
}
//#endregion
export { FileUpload };

//# sourceMappingURL=file-upload.js.map