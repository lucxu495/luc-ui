"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { spring } from "./tokens.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, createContext, isValidElement, useCallback, useContext, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
//#region src/motion/card-stack.tsx
const CardStackContext = createContext(null);
function useCardStackContext(component) {
	const context = useContext(CardStackContext);
	if (!context) throw new Error(`<${component}> must be rendered inside <CardStack>.`);
	return context;
}
/** The public hook, for a caller that wants to drive its own controls. */
function useCardStack() {
	return useCardStackContext("useCardStack");
}
/**
* LUC `CardStack` — depth as navigation.
*
* Five cards in a row is a carousel; five cards in a deck is a *stack*, and the
* difference is that a stack tells you where you are: the active card is largest
* and closest, the ones behind it recede on three axes at once (z, scale and a
* little rotation), and stepping moves the whole deck rather than sliding a
* track.
*
* It stays usable everywhere:
*
*  - Arrow keys, Home and End step the deck; the container is focusable and the
*    cards behind the active one are `inert`, so Tab can never land inside a card
*    the user cannot see.
*  - A horizontal pointer drag (48px threshold, `touch-action: pan-y`) steps on
*    touch without stealing vertical scrolling.
*  - Reduced motion keeps the arrangement and drops the travel: positions are
*    computed the same way, they just resolve instantly.
*  - A polite live region announces "2 / 5", so the deck is navigable by ear.
*
* Direct children should be `CardStackItem`s; anything else is rendered on top
* of the deck, which is how `<CardStackControls />` gets a place to live.
*/
function CardStack({ className, children, index, defaultIndex = 0, onIndexChange, visible = 3, offsetX = 0, offsetY = 14, shrink = .06, spread = 0, dim = .28, loop = false, label, ...props }) {
	const [uncontrolled, setUncontrolled] = useState(defaultIndex);
	const reduced = useReducedMotion();
	const dragStart = useRef(null);
	const all = useMemo(() => Children.toArray(children), [children]);
	const items = useMemo(() => all.filter((child) => isValidElement(child) && child.type === CardStackItem), [all]);
	const overlays = useMemo(() => all.filter((child) => !(isValidElement(child) && child.type === CardStackItem)), [all]);
	const count = items.length;
	const active = count === 0 ? 0 : ((index ?? uncontrolled) % count + count) % count;
	const setIndex = useCallback((next) => {
		if (count === 0) return;
		const clamped = loop ? (next % count + count) % count : Math.min(Math.max(next, 0), count - 1);
		if (index === void 0) setUncontrolled(clamped);
		if (clamped !== active) onIndexChange?.(clamped);
	}, [
		active,
		count,
		index,
		loop,
		onIndexChange
	]);
	const step = useCallback((delta) => setIndex(active + delta), [active, setIndex]);
	const value = useMemo(() => ({
		index: active,
		count,
		setIndex,
		step,
		loop
	}), [
		active,
		count,
		loop,
		setIndex,
		step
	]);
	const layer = (position) => {
		const depth = Math.min(position, visible);
		return {
			x: depth * offsetX,
			y: depth * offsetY,
			scale: 1 - depth * shrink,
			rotate: depth * spread,
			zIndex: Math.min(visible, 3) + 1 - depth,
			opacity: position > visible ? 0 : Math.max(.35, 1 - depth * dim)
		};
	};
	return /* @__PURE__ */ jsx(CardStackContext.Provider, {
		value,
		children: /* @__PURE__ */ jsxs("div", {
			"data-slot": "card-stack",
			"data-active": active,
			role: "group",
			...label ? { "aria-label": label } : {},
			tabIndex: 0,
			className: cn("luc-focus relative isolate min-h-60 select-none [perspective:1200px] [transform-style:preserve-3d]", "[touch-action:pan-y]", className),
			onKeyDown: (event) => {
				const keys = {
					ArrowRight: 1,
					ArrowDown: 1,
					ArrowLeft: -1,
					ArrowUp: -1
				};
				if (event.key === "Home") {
					event.preventDefault();
					setIndex(0);
					return;
				}
				if (event.key === "End") {
					event.preventDefault();
					setIndex(count - 1);
					return;
				}
				const delta = keys[event.key];
				if (delta === void 0) return;
				event.preventDefault();
				step(delta);
			},
			onPointerDown: (event) => {
				if (event.pointerType === "mouse" && event.button !== 0) return;
				dragStart.current = event.clientX;
			},
			onPointerUp: (event) => {
				const start = dragStart.current;
				dragStart.current = null;
				if (start === null) return;
				const delta = event.clientX - start;
				if (Math.abs(delta) < 48) return;
				step(delta < 0 ? 1 : -1);
			},
			onPointerCancel: () => {
				dragStart.current = null;
			},
			...props,
			children: [
				/* @__PURE__ */ jsx("span", {
					role: "status",
					"aria-live": "polite",
					className: "sr-only",
					children: count === 0 ? "" : `${active + 1} / ${count}`
				}),
				items.map((child, itemIndex) => {
					const position = count === 0 ? 0 : (itemIndex - active + count) % count;
					const isActive = position === 0;
					return /* @__PURE__ */ jsx(motion.div, {
						"data-slot": "card-stack-layer",
						"data-position": position,
						"aria-hidden": isActive ? void 0 : true,
						inert: !isActive,
						className: cn("absolute inset-0 [transform-style:preserve-3d]", !isActive && "pointer-events-none"),
						initial: false,
						animate: layer(position),
						transition: reduced ? { duration: 0 } : spring.responsive,
						children: child
					}, isValidElement(child) && child.key !== null ? child.key : itemIndex);
				}),
				overlays.length > 0 ? /* @__PURE__ */ jsx("div", {
					"data-slot": "card-stack-overlay",
					className: "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 p-2 [&>*]:pointer-events-auto",
					children: overlays
				}) : null
			]
		})
	});
}
/** A card in a `CardStack`. Its position is decided by the stack, not by you. */
function CardStackItem({ className, children, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "card-stack-item",
		className: cn("h-full w-full", className),
		...props,
		children
	});
}
/**
* Previous/next for a `CardStack`, as a composable slot. It is a separate
* component rather than a `controls` boolean so a caller can put it anywhere —
* under the deck, beside it, or inside a toolbar — without the stack growing a
* prop for every position.
*/
function CardStackControls({ className, previousLabel = "Previous card", nextLabel = "Next card", children, ...props }) {
	const { index, count, step, loop } = useCardStackContext("CardStackControls");
	const atStart = !loop && index === 0;
	const atEnd = !loop && index >= count - 1;
	const buttonClass = "luc-focus inline-flex size-8 items-center justify-center rounded-full border border-line-subtle bg-surface-raised text-fg-secondary luc-transition hover:border-line-strong hover:text-fg-primary disabled:opacity-40";
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "card-stack-controls",
		className: cn("flex items-center gap-2", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => step(-1),
				disabled: atStart,
				"aria-label": previousLabel,
				className: buttonClass,
				children: /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: "‹"
				})
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => step(1),
				disabled: atEnd,
				"aria-label": nextLabel,
				className: buttonClass,
				children: /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: "›"
				})
			}),
			children
		]
	});
}
//#endregion
export { CardStack, CardStackControls, CardStackItem, useCardStack };

//# sourceMappingURL=card-stack.js.map