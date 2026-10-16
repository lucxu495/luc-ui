"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
//#region src/components/carousel.tsx
const CarouselContext = createContext(null);
function useCarouselContext(component) {
	const value = useContext(CarouselContext);
	if (!value) throw new Error(`${component} must be used inside <Carousel> — see the Showcase page.`);
	return value;
}
function Carousel({ className, label, index, defaultIndex = 0, onIndexChange, autoplay = false, interval = 6e3, itemLabel, children, ...props }) {
	const trackId = `luc-carousel-${useId()}`;
	const [internalIndex, setInternalIndex] = useState(defaultIndex);
	const [count, setCount] = useState(0);
	const current = index ?? internalIndex;
	const viewportRef = useRef(null);
	const setIndex = useCallback((next) => {
		if (index === void 0) setInternalIndex(next);
		onIndexChange?.(next);
	}, [index, onIndexChange]);
	const scrollTo = useCallback((next) => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const slide = viewport.querySelector(`[data-carousel-index="${next}"]`);
		if (!slide) return;
		const target = slide.offsetLeft - viewport.offsetLeft;
		if (typeof viewport.scrollTo === "function") viewport.scrollTo({
			left: target,
			behavior: "smooth"
		});
		else viewport.scrollLeft = target;
	}, []);
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		let frame = 0;
		const onScroll = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const slides = Array.from(viewport.querySelectorAll("[data-carousel-index]"));
				if (slides.length === 0) return;
				const center = viewport.scrollLeft + viewport.clientWidth / 2;
				let nearest = 0;
				let distance = Number.POSITIVE_INFINITY;
				for (const slide of slides) {
					const slideCenter = slide.offsetLeft - viewport.offsetLeft + slide.clientWidth / 2;
					const next = Math.abs(slideCenter - center);
					if (next < distance) {
						distance = next;
						nearest = Number(slide.dataset.carouselIndex ?? 0);
					}
				}
				setIndex(nearest);
			});
		};
		viewport.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			viewport.removeEventListener("scroll", onScroll);
		};
	}, [setIndex]);
	useEffect(() => {
		if (!autoplay || count <= 1) return;
		if (typeof window === "undefined") return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const viewport = viewportRef.current;
		if (!viewport) return;
		let paused = false;
		const pause = () => {
			paused = true;
		};
		const resume = () => {
			paused = false;
		};
		viewport.addEventListener("pointerenter", pause);
		viewport.addEventListener("pointerleave", resume);
		viewport.addEventListener("focusin", pause);
		viewport.addEventListener("focusout", resume);
		const timer = window.setInterval(() => {
			if (paused || document.hidden) return;
			scrollTo((current + 1) % count);
		}, interval);
		return () => {
			window.clearInterval(timer);
			viewport.removeEventListener("pointerenter", pause);
			viewport.removeEventListener("pointerleave", resume);
			viewport.removeEventListener("focusin", pause);
			viewport.removeEventListener("focusout", resume);
		};
	}, [
		autoplay,
		count,
		current,
		interval,
		scrollTo
	]);
	const value = {
		trackId,
		index: current,
		setIndex,
		count,
		setCount,
		scrollTo
	};
	return /* @__PURE__ */ jsx(CarouselContext.Provider, {
		value,
		children: /* @__PURE__ */ jsxs("section", {
			"data-slot": "carousel",
			"aria-roledescription": "carousel",
			"aria-label": label,
			className: cn("relative flex flex-col gap-3", className),
			...props,
			children: [/* @__PURE__ */ jsx("div", {
				ref: viewportRef,
				"data-slot": "carousel-viewport",
				className: "contents",
				children
			}), /* @__PURE__ */ jsx("span", {
				"aria-live": "polite",
				"aria-atomic": "true",
				className: "sr-only",
				children: count > 0 ? itemLabel?.(current, count) ?? `Slide ${current + 1} of ${count}` : null
			})]
		})
	});
}
function CarouselTrack({ className, itemWidth = "min(20rem, 82%)", gap = "1rem", children, style, ...props }) {
	const { trackId, setCount } = useCarouselContext("CarouselTrack");
	const items = Children.toArray(children);
	useEffect(() => {
		setCount(items.length);
	}, [items.length, setCount]);
	return /* @__PURE__ */ jsx("div", {
		id: trackId,
		"data-slot": "carousel-track",
		tabIndex: 0,
		role: "region",
		"aria-roledescription": "carousel track",
		className: cn("flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth", "pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", "luc-focus-inset", className),
		style: {
			gap,
			scrollPaddingInline: gap,
			...style
		},
		"data-item-width": itemWidth,
		...props,
		children: items.map((child, position) => isValidElement(child) ? cloneElement(child, {
			index: position,
			count: items.length,
			width: child.props.width ?? itemWidth
		}) : child)
	});
}
function CarouselItem({ className, label, width, index = 0, count = 0, children, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "carousel-item",
		"data-carousel-index": index,
		role: "group",
		"aria-roledescription": "slide",
		"aria-label": label ?? `Slide ${index + 1}${count ? ` of ${count}` : ""}`,
		className: cn("shrink-0 snap-start", className),
		style: {
			width,
			flexBasis: width
		},
		...props,
		children
	});
}
function CarouselControls({ className, dots = true, arrows = true, previousLabel = "Previous slide", nextLabel = "Next slide", dotsLabel = "Slides", ...props }) {
	const { index, count, scrollTo, setIndex, trackId } = useCarouselContext("CarouselControls");
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "carousel-controls",
		className: cn("flex items-center justify-between gap-3", className),
		...props,
		children: [dots ? /* @__PURE__ */ jsx("div", {
			className: "flex items-center gap-0.5",
			role: "tablist",
			"aria-label": dotsLabel,
			children: Array.from({ length: count }).map((_, position) => /* @__PURE__ */ jsx("button", {
				type: "button",
				role: "tab",
				"aria-selected": position === index,
				"aria-controls": trackId,
				"aria-label": `Go to slide ${position + 1}`,
				onClick: () => {
					setIndex(position);
					scrollTo(position);
				},
				className: "grid size-6 place-items-center rounded-full luc-focus",
				children: /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn("block h-2 rounded-full luc-transition", position === index ? "w-5 bg-accent-default shadow-[var(--glow-subtle)]" : "w-2 bg-line-strong group-hover/carousel:bg-fg-muted")
				})
			}, position))
		}) : /* @__PURE__ */ jsx("span", {}), arrows ? /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ jsx(IconButton, {
				variant: "solid",
				size: "sm",
				label: previousLabel,
				icon: /* @__PURE__ */ jsx(RiArrowLeftSLine, {}),
				disabled: index <= 0,
				onClick: () => {
					setIndex(index - 1);
					scrollTo(index - 1);
				}
			}), /* @__PURE__ */ jsx(IconButton, {
				variant: "solid",
				size: "sm",
				label: nextLabel,
				icon: /* @__PURE__ */ jsx(RiArrowRightSLine, {}),
				disabled: index >= count - 1,
				onClick: () => {
					setIndex(index + 1);
					scrollTo(index + 1);
				}
			})]
		}) : null]
	});
}
/** Read-only access for a consumer that wants to build its own controls. */
function useCarousel() {
	const { trackId, index, setIndex, count, scrollTo } = useCarouselContext("useCarousel");
	return {
		trackId,
		index,
		setIndex,
		count,
		scrollTo
	};
}
//#endregion
export { Carousel, CarouselControls, CarouselItem, CarouselTrack, useCarousel };

//# sourceMappingURL=carousel.js.map