"use client";
//#region src/hooks/use-flash-target.ts
const timers = /* @__PURE__ */ new WeakMap();
function prefersReducedMotion() {
	if (typeof document !== "undefined") {
		const motion = document.documentElement.dataset.motion;
		if (motion === "reduced") return true;
		if (motion === "full") return false;
	}
	return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/** Mark one element, then clear the mark after the beat. */
function flashElement(element, options = {}) {
	if (!element) return;
	const { attribute = "data-target-flash", value = "true", durationMs } = options;
	const previous = timers.get(element);
	if (previous) clearTimeout(previous);
	element.setAttribute(attribute, value);
	const hold = durationMs ?? (prefersReducedMotion() ? 650 : 1e3);
	timers.set(element, setTimeout(() => {
		timers.delete(element);
		element.removeAttribute(attribute);
	}, hold));
}
/** Mark the element with this DOM id (no-op when it is not on the page). */
function flashTarget(targetId, options) {
	if (typeof document === "undefined") return;
	flashElement(document.getElementById(targetId), options);
}
/** The sticky chrome's own height, so a jump never lands under it. */
function stickyChromeHeight() {
	if (typeof window === "undefined") return 64;
	const root = getComputedStyle(document.documentElement);
	const raw = root.getPropertyValue("--shell-topbar-height").trim();
	const value = Number.parseFloat(raw);
	if (!Number.isFinite(value)) return 64;
	return raw.endsWith("rem") ? value * (Number.parseFloat(root.fontSize) || 16) : value;
}
/**
* Resolve when the document has reached `top` (or the wait gives out).
*
* Checking the destination rather than "did the scroll stop" is what makes a
* smooth jump's emphasis land *on arrival*: an animated scroll passes through
* every intermediate position, and only the last one is the card the reader was
* sent to. A page that cannot scroll all the way (a short final card) still
* resolves — on the timeout, having made all the progress it can.
*/
function settledAt(top, timeoutMs) {
	return new Promise((resolve) => {
		const deadline = performance.now() + timeoutMs;
		const tick = () => {
			if (Math.abs(window.scrollY - top) <= 1 || performance.now() >= deadline) return resolve();
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
}
/**
* Scroll to a jump target and flash it **when it arrives**.
*
* Flashing at click time is wrong whenever the jump animates: the emphasis is
* spent while the page is still moving, and the reader arrives at a card that is
* already back to normal. So the emphasis is a consequence of arrival — scroll,
* wait for the document to settle, then mark the card. The caller keeps the
* navigator's active state pinned for the same interval with `lock`/`release`.
*/
async function revealTarget(targetId, options = {}) {
	if (typeof document === "undefined" || typeof window === "undefined") return;
	const element = document.getElementById(targetId);
	if (!element) return;
	const { offsetPx = stickyChromeHeight() + 24, behavior = "smooth", flash = true, durationMs, settleTimeoutMs = 1400 } = options;
	const reduced = prefersReducedMotion();
	const step = reduced ? "auto" : behavior;
	const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - offsetPx);
	window.scrollTo({
		top,
		behavior: step
	});
	await (step === "auto" ? Promise.resolve() : settledAt(top, settleTimeoutMs));
	if (!flash) return;
	flashElement(element, { durationMs: durationMs ?? (reduced ? 800 : 1100) });
}
//#endregion
export { flashElement, flashTarget, revealTarget };

//# sourceMappingURL=use-flash-target.js.map