"use client";
import { useEffect, useRef, useState } from "react";
//#region src/hooks/use-scroll-spy.ts
/**
* The active target for a scroll state.
*
* The reading line sits below the sticky chrome. The reader is on the last
* substantive card that started above it; before the first card reaches the line
* the report has not begun, so the first card is the reader's place. At the very
* bottom the last card wins even if it is too short to reach the line.
*/
function resolveActiveTarget(state) {
	const { targets, readingOffset } = state;
	if (targets.length === 0) return null;
	const scrollableSlack = state.scrollableSlack ?? 8;
	const bottomSlack = state.bottomSlack ?? 4;
	const primary = targets.filter((target) => target.primary);
	const ordered = [...primary.length > 0 ? primary : targets].sort((left, right) => left.top - right.top);
	const scrollable = state.documentHeight - state.viewportHeight;
	if (scrollable > scrollableSlack && state.scrollY >= scrollable - bottomSlack) return ordered[ordered.length - 1]?.id ?? null;
	const line = state.scrollY + readingOffset;
	let active = null;
	for (const target of ordered) {
		if (target.top > line) break;
		active = target.id;
	}
	return active ?? ordered[0]?.id ?? null;
}
/** The sticky chrome's own height, so the reading line sits below it. */
function stickyHeaderHeight() {
	if (typeof window === "undefined") return 0;
	const value = getComputedStyle(document.documentElement).getPropertyValue("--shell-topbar-height");
	const parsed = Number.parseFloat(value);
	if (Number.isFinite(parsed)) return value.trim().endsWith("rem") ? parsed * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) : parsed;
	return 64;
}
/**
* Track which of `ids` owns the viewport.
*
* `ids` must be stable across renders (memoize it at the call site); the hook
* re-subscribes only when the set of anchors actually changes.
*
* A *streamed* page replaces an anchor's node when a Suspense boundary resolves
* (a section placeholder swapping for the real content, which also adds the
* metrics inside it) and every card can change its height as a chart lays out.
* The hook therefore re-measures on mutation and on resize (and an
* `IntersectionObserver` gives it a cheap signal that geometry moved), keeping
* the offsets it needs for the arithmetic between measurements.
*/
function useScrollSpy(ids, options = {}) {
	const { attribute = "data-anchor-id", primaryIds, readingOffset = 56, lockMs = 1600 } = options;
	const [activeId, setActiveId] = useState(ids[0] ?? null);
	const lockUntil = useRef(0);
	const targets = useRef([]);
	const key = ids.join("\0");
	const primaryKey = (primaryIds ?? []).join("\0");
	useEffect(() => {
		if (ids.length === 0) return;
		const primary = new Set(primaryIds ?? ids);
		let disposed = false;
		let measureTimer;
		let scrollFrame = 0;
		/** Document-space offsets for every anchor currently in the document. */
		const measure = () => {
			const live = [];
			for (const id of ids) {
				const node = document.querySelector(`[${attribute}="${CSS.escape(id)}"]`);
				if (!node) continue;
				const rect = node.getBoundingClientRect();
				live.push({
					id,
					top: rect.top + window.scrollY,
					primary: primary.has(id)
				});
			}
			targets.current = live;
		};
		const reconcile = () => {
			if (Date.now() < lockUntil.current) return;
			const next = resolveActiveTarget({
				targets: targets.current,
				scrollY: window.scrollY,
				viewportHeight: window.innerHeight,
				documentHeight: document.documentElement.scrollHeight,
				readingOffset: stickyHeaderHeight() + readingOffset
			});
			if (next) setActiveId(next);
		};
		/** A scroll is pure arithmetic; it never measures, so it never thrashes. */
		const onScroll = () => {
			if (scrollFrame) return;
			scrollFrame = requestAnimationFrame(() => {
				scrollFrame = 0;
				reconcile();
			});
		};
		/**
		* Re-measure, then reconcile. Debounced: a streamed domain produces a burst
		* of mutations, and one measurement per burst is enough — the offsets are
		* only wrong while the layout is still moving.
		*/
		const resync = (immediate = false) => {
			if (disposed) return;
			if (immediate) {
				measure();
				reconcile();
				return;
			}
			if (measureTimer) clearTimeout(measureTimer);
			measureTimer = setTimeout(() => {
				measureTimer = void 0;
				requestAnimationFrame(() => {
					if (disposed) return;
					measure();
					reconcile();
				});
			}, 100);
		};
		resync(true);
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", () => resync(true));
		window.addEventListener("load", () => resync());
		const mutations = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => resync());
		mutations?.observe(document.documentElement, {
			childList: true,
			subtree: true
		});
		const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(() => resync(), { threshold: [
			0,
			.25,
			.5,
			1
		] });
		if (observer) for (const id of ids) for (const node of document.querySelectorAll(`[${attribute}="${CSS.escape(id)}"]`)) observer.observe(node);
		if (typeof document.fonts?.ready?.then === "function") document.fonts.ready.then(() => resync()).catch(() => void 0);
		return () => {
			disposed = true;
			if (measureTimer) clearTimeout(measureTimer);
			if (scrollFrame) cancelAnimationFrame(scrollFrame);
			observer?.disconnect();
			mutations?.disconnect();
			window.removeEventListener("scroll", onScroll);
		};
	}, [
		key,
		primaryKey,
		attribute,
		readingOffset
	]);
	return {
		activeId,
		lock: (id, holdMs) => {
			lockUntil.current = Date.now() + (holdMs ?? lockMs);
			setActiveId(id);
		},
		release: () => {
			lockUntil.current = 0;
		}
	};
}
//#endregion
export { resolveActiveTarget, useScrollSpy };

//# sourceMappingURL=use-scroll-spy.js.map