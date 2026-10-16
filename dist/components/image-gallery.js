"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { DialogContent, DialogRoot, DialogTitle } from "./dialog.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useId, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiFullscreenLine, RiZoomInLine, RiZoomOutLine } from "@remixicon/react";
//#region src/components/image-gallery.tsx
const columnClass = {
	2: "grid-cols-2",
	3: "grid-cols-2 sm:grid-cols-3",
	4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
};
const aspectClass = {
	square: "aspect-square",
	video: "aspect-video",
	natural: ""
};
function ImageGallery({ images, columns = 3, label = "Image gallery", onOpen, lightbox = true, aspect = "square", className, ...props }) {
	const [openIndex, setOpenIndex] = useState(null);
	const handlesViewer = lightbox && !onOpen;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "image-gallery",
		className: cn("flex flex-col gap-3", className),
		...props,
		children: [/* @__PURE__ */ jsx("ul", {
			"aria-label": label,
			className: cn("grid gap-2", columnClass[columns]),
			children: images.map((image, index) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: () => handlesViewer ? setOpenIndex(index) : onOpen?.(index),
				className: cn("group/image luc-transition luc-focus relative block h-full w-full overflow-hidden rounded-md", "border border-line-subtle bg-surface-sunken luc-rest hover:luc-hover hover:border-line-strong"),
				children: [/* @__PURE__ */ jsx("img", {
					src: image.src,
					alt: image.alt,
					width: image.width,
					height: image.height,
					loading: "lazy",
					decoding: "async",
					className: cn("h-full w-full object-cover luc-transition-slow group-hover/image:scale-[1.03]", aspectClass[aspect])
				}), handlesViewer ? /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn("absolute right-1.5 bottom-1.5 grid size-6 place-items-center rounded-sm", "bg-surface-overlay/80 text-fg-secondary opacity-0 backdrop-blur-sm luc-transition", "group-hover/image:opacity-100 group-focus-visible/image:opacity-100"),
					children: /* @__PURE__ */ jsx(RiFullscreenLine, { className: "size-3.5" })
				}) : null]
			}) }, image.id))
		}), handlesViewer ? /* @__PURE__ */ jsx(Lightbox, {
			images,
			index: openIndex ?? 0,
			open: openIndex !== null,
			onOpenChange: (next) => setOpenIndex(next ? openIndex ?? 0 : null),
			onIndexChange: setOpenIndex,
			label
		}) : null]
	});
}
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = .5;
function Lightbox({ images, index, open, onOpenChange, onIndexChange, label = "Image viewer", labels }) {
	const [zoomState, setZoomState] = useState({
		index,
		zoom: MIN_ZOOM
	});
	const zoom = zoomState.index === index ? zoomState.zoom : MIN_ZOOM;
	const setZoom = useCallback((next) => {
		setZoomState((current) => {
			const base = current.index === index ? current.zoom : MIN_ZOOM;
			return {
				index,
				zoom: typeof next === "function" ? next(base) : next
			};
		});
	}, [index]);
	const titleId = useId();
	const image = images[Math.min(Math.max(index, 0), images.length - 1)];
	const total = images.length;
	const step = useCallback((delta) => {
		if (total === 0) return;
		onIndexChange((index + delta + total) % total);
		setZoom(MIN_ZOOM);
	}, [
		index,
		onIndexChange,
		setZoom,
		total
	]);
	if (!image || total === 0) return null;
	return /* @__PURE__ */ jsx(DialogRoot, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			"data-slot": "lightbox",
			width: "lg",
			showClose: false,
			"aria-label": label,
			onKeyDown: (event) => {
				if (event.key === "ArrowRight") {
					event.preventDefault();
					step(1);
				} else if (event.key === "ArrowLeft") {
					event.preventDefault();
					step(-1);
				} else if (event.key === "+" || event.key === "=") {
					event.preventDefault();
					setZoom((value) => Math.min(value + ZOOM_STEP, MAX_ZOOM));
				} else if (event.key === "-") {
					event.preventDefault();
					setZoom((value) => Math.max(value - ZOOM_STEP, MIN_ZOOM));
				}
			},
			className: "flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden rounded-xl bg-surface-overlay p-0",
			children: [
				/* @__PURE__ */ jsx(DialogTitle, {
					id: titleId,
					className: "sr-only",
					children: label
				}),
				/* @__PURE__ */ jsxs("header", {
					className: "flex shrink-0 items-center justify-between gap-3 border-b border-line-subtle px-3 py-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "truncate text-label text-fg-secondary",
						children: image.alt
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex shrink-0 items-center gap-1",
						children: [
							/* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								className: "pr-1 text-caption text-fg-muted luc-numeric",
								children: labels?.counter ? labels.counter(index, total) : `${index + 1} / ${total}`
							}),
							/* @__PURE__ */ jsx(IconButton, {
								variant: "ghost",
								size: "sm",
								label: labels?.zoomOut ?? "Zoom out",
								icon: /* @__PURE__ */ jsx(RiZoomOutLine, {}),
								disabled: zoom <= MIN_ZOOM,
								onClick: () => setZoom((value) => Math.max(value - ZOOM_STEP, MIN_ZOOM))
							}),
							/* @__PURE__ */ jsx(IconButton, {
								variant: "ghost",
								size: "sm",
								label: labels?.zoomIn ?? "Zoom in",
								icon: /* @__PURE__ */ jsx(RiZoomInLine, {}),
								disabled: zoom >= MAX_ZOOM,
								onClick: () => setZoom((value) => Math.min(value + ZOOM_STEP, MAX_ZOOM))
							}),
							/* @__PURE__ */ jsx(IconButton, {
								variant: "ghost",
								size: "sm",
								label: labels?.close ?? "Close viewer",
								icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
								onClick: () => onOpenChange(false)
							})
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-surface-sunken",
					children: [/* @__PURE__ */ jsx("img", {
						src: image.src,
						alt: image.alt,
						width: image.width,
						height: image.height,
						style: { transform: `scale(${zoom})` },
						className: "max-h-full max-w-full object-contain transition-transform duration-[var(--motion-normal)] ease-[var(--ease-standard)]"
					}), total > 1 ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(IconButton, {
						variant: "solid",
						label: labels?.previous ?? "Previous image",
						icon: /* @__PURE__ */ jsx(RiArrowLeftSLine, {}),
						onClick: () => step(-1),
						className: "absolute top-1/2 left-3 -translate-y-1/2"
					}), /* @__PURE__ */ jsx(IconButton, {
						variant: "solid",
						label: labels?.next ?? "Next image",
						icon: /* @__PURE__ */ jsx(RiArrowRightSLine, {}),
						onClick: () => step(1),
						className: "absolute top-1/2 right-3 -translate-y-1/2"
					})] }) : null]
				}),
				image.caption ? /* @__PURE__ */ jsxs("p", {
					className: "shrink-0 border-t border-line-subtle px-4 py-2.5 text-caption text-fg-secondary",
					children: [image.caption, /* @__PURE__ */ jsxs("span", {
						className: "sr-only",
						children: [" ", `Zoom ${Math.round(zoom * 100)} percent.`]
					})]
				}) : /* @__PURE__ */ jsx("span", {
					className: "sr-only",
					"aria-live": "polite",
					children: `Zoom ${Math.round(zoom * 100)} percent.`
				})
			]
		})
	});
}
//#endregion
export { ImageGallery, Lightbox };

//# sourceMappingURL=image-gallery.js.map