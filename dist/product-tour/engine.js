//#region src/product-tour/engine.ts
const SIDES = [
	"bottom",
	"right",
	"top",
	"left"
];
/**
* Resolve every supported selector shape without assuming a document exists.
* A resolver function is useful for React refs and virtualised rows; a selector
* remains the compact default for page-level tours.
*/
function resolveTourTarget(target, root) {
	if (!target) return null;
	if (typeof target === "function") return target();
	if (typeof target !== "string") return target.isConnected ? target : null;
	return (root ?? (typeof document === "undefined" ? null : document))?.querySelector(target) ?? null;
}
/**
* `getBoundingClientRect()` is already in viewport coordinates, which is also
* the coordinate system of the fixed spotlight and bubble. Using scroll offsets
* here would double-count scrolling, especially inside nested containers.
*/
function measureTarget(element, padding = 8) {
	const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
	const rect = element.getBoundingClientRect();
	if (!element.isConnected || style?.display === "none" || style?.visibility === "hidden" || rect.width <= 0 || rect.height <= 0) return null;
	return {
		top: rect.top - padding,
		left: rect.left - padding,
		width: rect.width + padding * 2,
		height: rect.height + padding * 2
	};
}
function sameTourRect(a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
	return Math.abs(a.top - b.top) < .5 && Math.abs(a.left - b.left) < .5 && Math.abs(a.width - b.width) < .5 && Math.abs(a.height - b.height) < .5;
}
/**
* Scroll only when needed. `nearest` avoids jumping the page when the target is
* already visible, and the container is allowed to process the request first,
* so nested scroll areas work without a second geometry model.
*/
function revealTourTarget(element, reducedMotion) {
	const rect = element.getBoundingClientRect();
	const viewport = {
		width: typeof window === "undefined" ? 0 : window.innerWidth,
		height: typeof window === "undefined" ? 0 : window.innerHeight
	};
	if (rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewport.height && rect.right <= viewport.width) return;
	element.scrollIntoView({
		block: rect.height > viewport.height * .7 ? "nearest" : "center",
		inline: rect.width > viewport.width * .8 ? "nearest" : "center",
		behavior: reducedMotion ? "auto" : "smooth"
	});
}
function clamp(value, minimum, maximum) {
	return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
function candidate(side, anchor, bubble, gap) {
	switch (side) {
		case "top": return {
			top: anchor.top - gap - bubble.height,
			left: anchor.left + anchor.width / 2 - bubble.width / 2,
			fits: anchor.top - gap >= bubble.height
		};
		case "right": return {
			top: anchor.top + anchor.height / 2 - bubble.height / 2,
			left: anchor.left + anchor.width + gap,
			fits: anchor.left + anchor.width + gap + bubble.width <= Number.POSITIVE_INFINITY
		};
		case "left": return {
			top: anchor.top + anchor.height / 2 - bubble.height / 2,
			left: anchor.left - gap - bubble.width,
			fits: anchor.left - gap >= bubble.width
		};
		default: return {
			top: anchor.top + anchor.height + gap,
			left: anchor.left + anchor.width / 2 - bubble.width / 2,
			fits: false
		};
	}
}
function availableSpace(side, anchor, viewport) {
	switch (side) {
		case "top": return anchor.top;
		case "bottom": return viewport.height - (anchor.top + anchor.height);
		case "left": return anchor.left;
		default: return viewport.width - (anchor.left + anchor.width);
	}
}
/**
* Place the bubble, then shift it inside the viewport. A preferred side wins
* only when it can fit; otherwise the side with the most room wins. The returned
* tail coordinates stay clamped to the bubble's rounded shoulder.
*/
function positionTourBubble({ anchor, bubble, viewport, preferred = "auto", gap = 16, margin = 12 }) {
	if (!anchor) return {
		top: Math.max(margin, (viewport.height - bubble.height) / 2),
		left: Math.max(margin, (viewport.width - bubble.width) / 2),
		placement: "center",
		tail: null
	};
	const side = (preferred === "auto" ? [...SIDES] : [preferred, ...SIDES.filter((side) => side !== preferred).sort((a, b) => availableSpace(b, anchor, viewport) - availableSpace(a, anchor, viewport))]).find((candidateSide) => {
		const rect = candidate(candidateSide, anchor, bubble, gap);
		const minX = margin;
		const maxX = viewport.width - bubble.width - margin;
		const minY = margin;
		const maxY = viewport.height - bubble.height - margin;
		return availableSpace(candidateSide, anchor, viewport) >= (candidateSide === "top" || candidateSide === "bottom" ? bubble.height : bubble.width) + gap && rect.left >= minX - .5 && rect.left <= maxX + .5 && rect.top >= minY - .5 && rect.top <= maxY + .5;
	}) ?? [...SIDES].sort((a, b) => availableSpace(b, anchor, viewport) - availableSpace(a, anchor, viewport))[0];
	const raw = candidate(side, anchor, bubble, gap);
	const left = clamp(raw.left, margin, viewport.width - bubble.width - margin);
	const top = clamp(raw.top, margin, viewport.height - bubble.height - margin);
	const anchorCenterX = anchor.left + anchor.width / 2;
	const anchorCenterY = anchor.top + anchor.height / 2;
	const tailInset = Math.min(28, Math.max(18, bubble.width * .08));
	if (side === "top" || side === "bottom") return {
		top,
		left,
		placement: side,
		tail: {
			x: clamp(anchorCenterX - left, tailInset, bubble.width - tailInset),
			y: side === "top" ? bubble.height : 0,
			side: side === "top" ? "bottom" : "top"
		}
	};
	return {
		top,
		left,
		placement: side,
		tail: {
			x: side === "left" ? bubble.width : 0,
			y: clamp(anchorCenterY - top, tailInset, bubble.height - tailInset),
			side: side === "left" ? "right" : "left"
		}
	};
}
//#endregion
export { measureTarget, positionTourBubble, resolveTourTarget, revealTourTarget, sameTourRect };

//# sourceMappingURL=engine.js.map