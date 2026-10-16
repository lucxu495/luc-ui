"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dialog } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import { RiSearchLine } from "@remixicon/react";
import { Command as Command$1, CommandDialog as CmdkCommandDialog, useCommandState } from "cmdk";
//#region src/components/command.tsx
function Command({ className, label = "Command menu", loop = true, ...props }) {
	return /* @__PURE__ */ jsx(Command$1, {
		label,
		loop,
		className: cn("flex h-full w-full flex-col overflow-hidden", className),
		...props
	});
}
function CommandInput({ className, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2.5 border-b border-line-subtle px-4",
		"cmdk-input-wrapper": "",
		children: [/* @__PURE__ */ jsx(RiSearchLine, {
			"aria-hidden": "true",
			className: "size-4 shrink-0 text-fg-muted"
		}), /* @__PURE__ */ jsx(Command$1.Input, {
			"data-slot": "command-input",
			className: cn("h-12 w-full bg-transparent text-body text-fg-primary outline-none", "placeholder:text-fg-disabled", className),
			...props
		})]
	});
}
function CommandList({ className, ...props }) {
	return /* @__PURE__ */ jsx(Command$1.List, {
		"data-slot": "command-list",
		className: cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5", "max-h-[min(24rem,60vh)]", className),
		...props
	});
}
function CommandGroup({ className, heading, ...props }) {
	return /* @__PURE__ */ jsx(Command$1.Group, {
		heading,
		className: cn("text-fg-primary", "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1", "[&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:font-medium", "[&_[cmdk-group-heading]]:text-fg-muted [&_[cmdk-group-heading]]:uppercase", className),
		...props
	});
}
function CommandItem({ className, children, icon, shortcut, description, ...props }) {
	return /* @__PURE__ */ jsxs(Command$1.Item, {
		"data-slot": "command-item",
		className: cn("group/item flex cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-2", "text-label text-fg-secondary outline-none luc-transition", "data-[selected=true]:bg-surface-interactive-hover data-[selected=true]:text-fg-primary", "data-[disabled=true]:pointer-events-none data-[disabled=true]:text-fg-disabled", className),
		...props,
		children: [
			icon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "grid size-4 shrink-0 place-items-center text-fg-muted group-data-[selected=true]/item:text-fg-accent [&_svg]:size-4",
				children: icon
			}) : null,
			/* @__PURE__ */ jsxs("span", {
				className: "flex min-w-0 flex-1 flex-col gap-0.5",
				children: [/* @__PURE__ */ jsx("span", {
					className: "truncate",
					children
				}), description ? /* @__PURE__ */ jsx("span", {
					className: "truncate text-caption text-fg-muted",
					children: description
				}) : null]
			}),
			shortcut ? /* @__PURE__ */ jsx("kbd", {
				className: "ml-3 shrink-0 rounded-xs border border-line-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-micro text-fg-muted",
				children: shortcut
			}) : null
		]
	});
}
function CommandSeparator({ className, ...props }) {
	return /* @__PURE__ */ jsx(Command$1.Separator, {
		className: cn("mx-1 my-1 h-px bg-line-subtle", className),
		...props
	});
}
function CommandEmpty({ className, children = "No results found", ...props }) {
	return /* @__PURE__ */ jsx(Command$1.Empty, {
		className: cn("px-3 py-6 text-center text-caption text-fg-muted", className),
		...props,
		children
	});
}
function CommandLoading({ className, children = "Loading…", ...props }) {
	return /* @__PURE__ */ jsx(Command$1.Loading, {
		className: cn("px-3 py-6 text-center text-caption text-fg-muted", className),
		...props,
		children
	});
}
/**
* The palette shell: a top-anchored dialog so the search field lands where the
* eye already is, with an opaque overlay surface.
*/
function CommandMenu({ open, onOpenChange, children, label = "Command menu", description, footer, className }) {
	return /* @__PURE__ */ jsx(Dialog.Root, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(Dialog.Portal, { children: [/* @__PURE__ */ jsx(Dialog.Overlay, {
			"data-slot": "command-overlay",
			className: cn("fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]", "data-[state=open]:animate-[luc-scrim-in_var(--motion-fast)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]")
		}), /* @__PURE__ */ jsxs(Dialog.Content, {
			"data-slot": "command-menu",
			"aria-label": label,
			className: cn("fixed top-[12vh] left-1/2 z-[var(--z-modal)] w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2", "overflow-hidden rounded-xl border border-line-default bg-surface-overlay luc-float-high", "focus:outline-none", "data-[state=open]:animate-[luc-overlay-in_var(--motion-fast)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]", className),
			children: [
				/* @__PURE__ */ jsx(Dialog.Title, {
					className: "sr-only",
					children: label
				}),
				description ? /* @__PURE__ */ jsx("p", {
					className: "border-b border-line-subtle px-4 py-2 text-caption text-fg-muted",
					children: description
				}) : null,
				children,
				footer ? /* @__PURE__ */ jsx("div", {
					className: "flex items-center justify-between gap-3 border-t border-line-subtle bg-surface-raised/40 px-4 py-2 text-caption text-fg-muted",
					children: footer
				}) : null
			]
		})] })
	});
}
/**
* Nested pages inside one palette (root → sub-page → back), the pattern cmdk
* documents: keep a page stack, clear the search on navigation, and pop with
* Backspace when the field is empty.
*/
function useCommandPages() {
	const [pages, setPages] = useState([]);
	const [search, setSearch] = useState("");
	const page = pages[pages.length - 1];
	const push = useCallback((next) => {
		setPages((current) => [...current, next]);
		setSearch("");
	}, []);
	const pop = useCallback(() => {
		setPages((current) => current.slice(0, -1));
		setSearch("");
	}, []);
	return {
		pages,
		page,
		search,
		setSearch,
		push,
		pop,
		reset: useCallback(() => {
			setPages([]);
			setSearch("");
		}, []),
		onKeyDown: useCallback((event) => {
			if (event.key === "Backspace" && search.length === 0 && pages.length > 0) {
				event.preventDefault();
				pop();
			}
		}, [
			pages.length,
			pop,
			search.length
		])
	};
}
/**
* ⌘K / Ctrl+K. Deliberately tiny — a hotkey is 20 lines, not a dependency.
* The Showcase uses this; products may wire their own global handler instead.
*/
function useCommandHotkey(onOpen, enabled = true) {
	useEffect(() => {
		if (!enabled) return;
		const onKeyDown = (event) => {
			if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				onOpen();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [enabled, onOpen]);
}
//#endregion
export { Command, CmdkCommandDialog as CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading, CommandMenu, CommandSeparator, useCommandHotkey, useCommandPages, useCommandState };

//# sourceMappingURL=command.js.map