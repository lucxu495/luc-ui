//#region src/charts/core/inspector-size.ts
/**
* The size of the expanded chart inspector, and the reader's remembered
* preference for it.
*
* Three rules, all of them the kind that must not live in a component's head:
*
*  1. **The default is viewport-relative, not a pixel size for one laptop.** A
*     24" display must get a much larger plotting area than a 13" one, so the
*     default is a fraction of the viewport, clamped by absolute floors and
*     ceilings.
*  2. **A remembered size is a preference, never a trap.** It is clamped against
*     the *current* viewport every time the inspector opens, with a margin, so a
*     size chosen on a large external monitor can never make the panel
*     inaccessible on a laptop — and the reader never has to clear storage.
*  3. **Only the size is remembered.** Versioned key, two numbers, nothing else:
*     no chart, no range, no series, no data.
*
* Everything here is pure so the geometry can be asserted without a browser.
*/
/** Versioned storage key. A future shape gets `v2` rather than a migration. */
const INSPECTOR_SIZE_KEY = "luc.chartInspector.size.v1";
/** The share of the viewport the default opens on. */
const INSPECTOR_DEFAULT_WIDTH_RATIO = .88;
const INSPECTOR_DEFAULT_HEIGHT_RATIO = .84;
/** Absolute ceilings, so a 4K display does not stretch a series into a field. */
const INSPECTOR_MAX_WIDTH = 1800;
const INSPECTOR_MAX_HEIGHT = 1080;
function positive(value) {
	const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
/**
* The largest inspector the current viewport allows, margins included.
*
* A viewport smaller than the floors wins: an inspector that does not fit is
* worse than one that is smaller than the design minimum, so the floor is
* dropped rather than letting the panel overflow.
*/
function maxInspectorSize(viewport, gutter = 16) {
	return {
		width: Math.max(1, Math.round(viewport.width - gutter * 2)),
		height: Math.max(1, Math.round(viewport.height - gutter * 2))
	};
}
/** The size a fresh inspector opens on for this viewport. */
function defaultInspectorSize(viewport) {
	const max = maxInspectorSize(viewport);
	if (viewport.width < 768) return {
		width: max.width,
		height: max.height
	};
	const wanted = {
		width: Math.round(viewport.width * INSPECTOR_DEFAULT_WIDTH_RATIO),
		height: Math.round(viewport.height * INSPECTOR_DEFAULT_HEIGHT_RATIO)
	};
	return {
		width: Math.min(wanted.width, INSPECTOR_MAX_WIDTH, max.width),
		height: Math.min(wanted.height, INSPECTOR_MAX_HEIGHT, max.height)
	};
}
/** Clamp any candidate size into what this viewport can actually show. */
function clampInspectorSize(size, viewport, options = {}) {
	const hardMax = maxInspectorSize(viewport, options.gutter);
	const minWidth = Math.min(options.min?.width ?? 480, hardMax.width);
	const minHeight = Math.min(options.min?.height ?? 320, hardMax.height);
	return {
		width: size?.width === void 0 ? minWidth : Math.round(Math.min(Math.max(size.width, minWidth), hardMax.width)),
		height: size?.height === void 0 ? minHeight : Math.round(Math.min(Math.max(size.height, minHeight), hardMax.height))
	};
}
/**
* Apply one resize gesture.
*
* The panel is centred, so a drag on an edge moves *both* edges: dragging the
* left edge by `dx` widens the panel by `2 * -dx` around the same centre. Sizes
* are clamped per axis, which is also what keeps a drag from inverting the box.
*/
function resizeInspector(from, delta, viewport, options = {}) {
	const hardMax = maxInspectorSize(viewport, options.gutter);
	const minWidth = Math.min(options.min?.width ?? 480, hardMax.width);
	const minHeight = Math.min(options.min?.height ?? 320, hardMax.height);
	const width = delta.horizontal ? Math.min(Math.max(from.width + 2 * (delta.dx ?? 0), minWidth), hardMax.width) : from.width;
	const height = delta.vertical ? Math.min(Math.max(from.height + 2 * (delta.dy ?? 0), minHeight), hardMax.height) : from.height;
	return {
		width: Math.round(width),
		height: Math.round(height)
	};
}
/** Read the remembered size. Storage failures (private mode, quota) are not errors. */
function readInspectorSize(storage = safeStorage()) {
	if (!storage) return null;
	let raw = null;
	try {
		raw = storage.getItem(INSPECTOR_SIZE_KEY);
	} catch {
		return null;
	}
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		const width = positive(parsed?.width);
		const height = positive(parsed?.height);
		return width !== null && height !== null ? {
			width,
			height
		} : null;
	} catch {
		return null;
	}
}
/** Remember the size. Never throws: a preference is not worth a broken dialog. */
function storeInspectorSize(size, storage = safeStorage()) {
	if (!storage) return false;
	const width = positive(size.width);
	const height = positive(size.height);
	if (width === null || height === null) return false;
	try {
		storage.setItem(INSPECTOR_SIZE_KEY, JSON.stringify({
			width: Math.round(width),
			height: Math.round(height)
		}));
		return true;
	} catch {
		return false;
	}
}
/**
* The size the inspector should open on: the remembered one when it still fits,
* the viewport default otherwise.
*/
function openingInspectorSize(viewport, storage) {
	const remembered = readInspectorSize(storage === void 0 ? safeStorage() : storage);
	return remembered ? clampInspectorSize(remembered, viewport) : defaultInspectorSize(viewport);
}
function safeStorage() {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		return null;
	}
}
//#endregion
export { INSPECTOR_DEFAULT_HEIGHT_RATIO, INSPECTOR_DEFAULT_WIDTH_RATIO, INSPECTOR_MAX_HEIGHT, INSPECTOR_MAX_WIDTH, INSPECTOR_SIZE_KEY, clampInspectorSize, defaultInspectorSize, maxInspectorSize, openingInspectorSize, readInspectorSize, resizeInspector, storeInspectorSize };

//# sourceMappingURL=inspector-size.js.map