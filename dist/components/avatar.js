"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Avatar } from "radix-ui";
//#region src/components/avatar.tsx
/**
* LUC Avatar — identity for a person, a team, a workspace or an agent.
*
* Two rules make an avatar usable in a dense product rather than merely
* decorative:
*
*  1. **The fallback is designed, not a failure state.** Radix holds the image
*     back until it loads, so the initials are what most readers see on a cold
*     cache. They get a deterministic tint derived from the name, so the same
*     person is the same colour in a table, a comment thread and a header.
*  2. **The label is the name.** A single screen-reader string is the only shape
*     that survives every reader; `alt` on an `<img>` inside a link is read
*     twice.
*
* `AvatarGroup` overlaps its children and exposes the overflow count as real
* text (`+3`), never as a hidden badge.
*/
const AvatarRoot = Avatar.Root;
const sizeClass = {
	xs: "size-6 text-[10px]",
	sm: "size-8 text-micro",
	md: "size-10 text-label",
	lg: "size-12 text-body",
	xl: "size-16 text-title"
};
const shapeClass = {
	circle: "rounded-full",
	rounded: "rounded-lg",
	square: "rounded-sm"
};
/**
* Deterministic tint.
*
* The name is hashed to one of six semantic surfaces so two people in the same
* list never share a colour by accident, and the colour does not move when a
* list is re-sorted — which is exactly what a random tint would do.
*/
function tintIndex(seed, buckets) {
	let hash = 0;
	for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
	return Math.abs(hash) % buckets;
}
function Avatar$1({ className, src, alt, fallback, name, size = "md", shape = "circle", status, ...props }) {
	const label = name ?? alt;
	const tint = tintIndex(label ?? "luc", 6);
	return /* @__PURE__ */ jsxs(Avatar.Root, {
		"data-slot": "avatar",
		role: "img",
		"aria-label": label ?? "Avatar",
		className: cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden", "border border-line-subtle bg-surface-interactive font-medium text-fg-secondary shadow-rest", sizeClass[size], shapeClass[shape], className),
		...props,
		children: [
			src ? /* @__PURE__ */ jsx(Avatar.Image, {
				src,
				alt: "",
				className: "size-full object-cover",
				"data-slot": "avatar-image"
			}) : null,
			/* @__PURE__ */ jsx(Avatar.Fallback, {
				"data-slot": "avatar-fallback",
				"aria-hidden": "true",
				"data-tint": tint,
				delayMs: src ? 200 : void 0,
				className: cn("grid size-full place-items-center uppercase", tint === 0 && "bg-accent-soft text-fg-accent", tint === 1 && "bg-info-soft text-fg-info", tint === 2 && "bg-positive-soft text-fg-positive", tint === 3 && "bg-warning-soft text-fg-warning", tint === 4 && "bg-negative-soft text-fg-negative", tint === 5 && "bg-surface-interactive text-fg-secondary"),
				children: fallback ?? initialsOf(label)
			}),
			status ? /* @__PURE__ */ jsx("span", {
				"data-slot": "avatar-status",
				"aria-hidden": "true",
				className: cn("absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-surface-default", status === "online" && "bg-positive", status === "away" && "bg-warning", status === "offline" && "bg-fg-disabled", size === "xs" && "size-2")
			}) : null
		]
	});
}
/** "Ada Lovelace" → "AL"; "luc-ui" → "LU"; "谢健" → "谢". */
function initialsOf(name, max = 2) {
	if (!name) return "?";
	const trimmed = name.trim();
	if (!trimmed) return "?";
	if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(trimmed)) return Array.from(trimmed)[0] ?? "?";
	return trimmed.split(/[\s._-]+/).filter(Boolean).slice(0, max).map((word) => Array.from(word)[0] ?? "").join("").toUpperCase() || "?";
}
function AvatarGroup({ className, children, max = 4, total, size = "sm", ...props }) {
	const items = Array.isArray(children) ? children : children ? [children] : [];
	const shown = items.slice(0, max);
	const hidden = Math.max(0, (total ?? items.length) - shown.length);
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "avatar-group",
		role: "group",
		className: cn("flex items-center", className),
		...props,
		children: [shown.map((child, index) => /* @__PURE__ */ jsx("span", {
			className: cn("rounded-full ring-2 ring-surface-default", index > 0 && "-ml-2"),
			children: child
		}, index)), hidden > 0 ? /* @__PURE__ */ jsxs("span", {
			"data-slot": "avatar-group-count",
			className: cn("-ml-2 inline-grid place-items-center rounded-full border border-line-subtle bg-surface-interactive", "font-medium text-fg-secondary ring-2 ring-surface-default", sizeClass[size]),
			children: ["+", hidden]
		}) : null]
	});
}
//#endregion
export { Avatar$1 as Avatar, AvatarGroup, AvatarRoot, initialsOf };

//# sourceMappingURL=avatar.js.map