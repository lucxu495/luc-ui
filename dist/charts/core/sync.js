//#region src/charts/core/sync.ts
/**
* Normalise a cursor value to epoch milliseconds.
*
* Engines disagree about what "time" is: ECharts uses milliseconds, Lightweight
* Charts uses seconds. Ten-digit values are therefore read as seconds and
* promoted; anything unparseable becomes `null` (a cursor leave).
*/
function normalizeCursorX(value) {
	if (value === null || value === void 0) return null;
	let ms;
	if (value instanceof Date) ms = value.getTime();
	else if (typeof value === "number") {
		if (!Number.isFinite(value)) return null;
		ms = Math.abs(value) < 1e11 ? value * 1e3 : value;
	} else ms = Date.parse(value);
	return Number.isFinite(ms) ? ms : null;
}
/** Normalise a visible range, or `null` when it is degenerate. */
function normalizeRange(range) {
	if (!range) return null;
	const from = normalizeCursorX(range.from);
	const to = normalizeCursorX(range.to);
	if (from === null || to === null || to <= from) return null;
	return {
		from,
		to
	};
}
function createChartSyncBus() {
	const subscribers = /* @__PURE__ */ new Map();
	const cursors = /* @__PURE__ */ new Map();
	const ranges = /* @__PURE__ */ new Map();
	const rangeMetas = /* @__PURE__ */ new Map();
	const pinned = /* @__PURE__ */ new Map();
	let frame = null;
	const pendingCursor = /* @__PURE__ */ new Map();
	const pendingRange = /* @__PURE__ */ new Map();
	function group(groupId) {
		let entry = subscribers.get(groupId);
		if (!entry) {
			entry = /* @__PURE__ */ new Map();
			subscribers.set(groupId, entry);
		}
		return entry;
	}
	function flush() {
		frame = null;
		for (const [groupId, payload] of pendingCursor) {
			const entry = subscribers.get(groupId);
			if (!entry) continue;
			for (const subscriber of entry.values()) {
				if (subscriber.id === payload.originId) continue;
				subscriber.onCursor?.(payload.x);
			}
		}
		pendingCursor.clear();
		for (const [groupId, payload] of pendingRange) {
			const entry = subscribers.get(groupId);
			if (!entry) continue;
			for (const subscriber of entry.values()) {
				if (subscriber.id === payload.meta.originId) continue;
				subscriber.onRange?.(payload.range, payload.meta);
			}
		}
		pendingRange.clear();
	}
	function schedule() {
		if (typeof requestAnimationFrame !== "function") {
			flush();
			return;
		}
		if (frame !== null) return;
		frame = requestAnimationFrame(flush);
	}
	return {
		subscribe(groupId, subscriber) {
			const entry = group(groupId);
			entry.set(subscriber.id, subscriber);
			if (ranges.has(groupId) && subscriber.onRange) subscriber.onRange(ranges.get(groupId) ?? null, rangeMetas.get(groupId) ?? {
				intent: "default",
				originId: "bus"
			});
			const currentPin = pinned.get(groupId);
			if (currentPin != null && subscriber.onCursor) subscriber.onCursor(currentPin);
			return () => {
				entry.delete(subscriber.id);
				if (entry.size === 0) {
					subscribers.delete(groupId);
					ranges.delete(groupId);
					rangeMetas.delete(groupId);
					cursors.delete(groupId);
					pinned.delete(groupId);
					pendingCursor.delete(groupId);
					pendingRange.delete(groupId);
				}
			};
		},
		publishCursor(groupId, x, originId) {
			if (pinned.get(groupId) != null) return;
			cursors.set(groupId, x);
			pendingCursor.set(groupId, {
				x,
				originId
			});
			schedule();
		},
		publishPinned(groupId, x, originId) {
			pinned.set(groupId, x);
			cursors.set(groupId, x);
			for (const subscriber of group(groupId).values()) {
				if (subscriber.id === originId && x === null) continue;
				subscriber.onCursor?.(x);
			}
		},
		publishRange(groupId, range, originId, meta) {
			const resolved = {
				intent: meta?.intent ?? "default",
				preset: meta?.preset,
				originId
			};
			ranges.set(groupId, range);
			rangeMetas.set(groupId, resolved);
			pendingRange.set(groupId, {
				range,
				meta: resolved
			});
			schedule();
		},
		getCursor(groupId) {
			return cursors.get(groupId) ?? null;
		},
		getRange(groupId) {
			return ranges.get(groupId) ?? null;
		},
		hasRange(groupId) {
			return ranges.has(groupId);
		},
		getRangeMeta(groupId) {
			return rangeMetas.get(groupId) ?? null;
		},
		getPinned(groupId) {
			return pinned.get(groupId) ?? null;
		},
		reset() {
			subscribers.clear();
			cursors.clear();
			ranges.clear();
			rangeMetas.clear();
			pinned.clear();
			pendingCursor.clear();
			pendingRange.clear();
			frame = null;
		}
	};
}
/** The default, module-level bus shared by every chart on the page. */
const chartSyncBus = createChartSyncBus();
//#endregion
export { chartSyncBus, createChartSyncBus, normalizeCursorX, normalizeRange };

//# sourceMappingURL=sync.js.map