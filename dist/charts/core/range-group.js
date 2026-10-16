//#region src/charts/core/range-group.ts
const groups = /* @__PURE__ */ new Map();
const listeners = /* @__PURE__ */ new Map();
const stateCache = /* @__PURE__ */ new Map();
const EMPTY_STATE = {
	preset: null,
	window: null,
	intent: "default",
	revision: 0,
	domain: null
};
function sameWindow(left, right) {
	if (left === null || right === null) return left === right;
	return left.from === right.from && left.to === right.to;
}
function readGroup(group) {
	let entry = groups.get(group);
	if (!entry) {
		entry = {
			members: /* @__PURE__ */ new Map(),
			preset: null,
			window: null,
			intent: "default",
			revision: 0
		};
		groups.set(group, entry);
	}
	return entry;
}
function unionDomain(entry) {
	let start = Number.POSITIVE_INFINITY;
	let end = Number.NEGATIVE_INFINITY;
	let seen = false;
	for (const member of entry.members.values()) {
		if (!member.domain) continue;
		start = Math.min(start, member.domain.from);
		end = Math.max(end, member.domain.to);
		seen = true;
	}
	return seen && Number.isFinite(start) && Number.isFinite(end) ? {
		from: start,
		to: end
	} : null;
}
/**
* The member whose declared default the group opens on.
*
* Widest first (a group is as wide as its widest declared member: `max` is
* absorbing), then the newest window, then the earliest start, then the member
* id -- a total order, so the result cannot depend on mount order.
*/
function declaredMember(entry) {
	let best = null;
	for (const [id, member] of entry.members) {
		if (member.preset === null) continue;
		if (!best) {
			best = {
				id,
				member
			};
			continue;
		}
		const incumbent = best.member;
		if (member.weight !== incumbent.weight) {
			if (member.weight > incumbent.weight) best = {
				id,
				member
			};
			continue;
		}
		const memberTo = member.window?.to ?? Number.NEGATIVE_INFINITY;
		const incumbentTo = incumbent.window?.to ?? Number.NEGATIVE_INFINITY;
		if (memberTo !== incumbentTo) {
			if (memberTo > incumbentTo) best = {
				id,
				member
			};
			continue;
		}
		const memberFrom = member.window?.from ?? Number.POSITIVE_INFINITY;
		const incumbentFrom = incumbent.window?.from ?? Number.POSITIVE_INFINITY;
		if (memberFrom !== incumbentFrom) {
			if (memberFrom < incumbentFrom) best = {
				id,
				member
			};
			continue;
		}
		if (id < best.id) best = {
			id,
			member
		};
	}
	return best?.member ?? null;
}
/** The state a group resolves to right now, including its unclaimed default. */
function rangeGroupState(group) {
	const entry = groups.get(group);
	if (!entry) return EMPTY_STATE;
	const cached = stateCache.get(group);
	if (cached && cached.revision === entry.revision) return cached.state;
	const domain = unionDomain(entry);
	const state = (() => {
		if (entry.intent !== "default") return {
			preset: entry.preset,
			window: entry.window,
			intent: entry.intent,
			revision: entry.revision,
			domain
		};
		const declared = declaredMember(entry);
		if (!declared) return {
			preset: null,
			window: null,
			intent: "default",
			revision: entry.revision,
			domain
		};
		return {
			preset: declared.preset,
			window: declared.window,
			intent: "default",
			revision: entry.revision,
			domain
		};
	})();
	stateCache.set(group, {
		revision: entry.revision,
		state
	});
	return state;
}
function notify(group) {
	const groupListeners = listeners.get(group);
	if (!groupListeners) return;
	for (const listener of [...groupListeners]) listener();
}
/** Apply a resolved state to the store, reporting whether anything changed. */
function commit(group, next) {
	const entry = groups.get(group);
	if (!entry) return false;
	if (entry.intent === next.intent && entry.preset === next.preset && sameWindow(entry.window, next.window)) return false;
	entry.preset = next.preset;
	entry.window = next.window;
	entry.intent = next.intent;
	entry.revision += 1;
	notify(group);
	return true;
}
/** Declare (or refresh) a member. Can only move an unclaimed group's default. */
function declareRangeMember(group, id, declaration) {
	const entry = readGroup(group);
	const before = entry.intent === "default" ? declaredMember(entry) : null;
	entry.members.set(id, {
		preset: declaration.preset,
		weight: declaration.weight,
		window: declaration.window,
		domain: declaration.domain
	});
	const after = entry.intent === "default" ? declaredMember(entry) : null;
	if (before?.preset !== after?.preset || !sameWindow(before?.window ?? null, after?.window ?? null)) {
		entry.revision += 1;
		notify(group);
	}
}
/**
* Refresh a member's loaded domain only.
*
* Data arriving, a series being replaced, a lazy section loading: the domain is
* bookkeeping (the anchor and coverage of the group), never intent. A member
* that grows history keeps the group exactly where the reader left it.
*/
function updateRangeMemberDomain(group, id, domain) {
	const entry = groups.get(group);
	const member = entry?.members.get(id);
	if (!entry || !member) return;
	if (sameWindow(member.domain, domain)) return;
	member.domain = domain;
	entry.revision += 1;
	notify(group);
}
/**
* Drop a member.
*
* A group nobody claimed forgets everything; a window a reader chose is kept, so
* a remount (a tab, a view switch, a reopened session) shows it again.
*/
function releaseRangeMember(group, id) {
	const entry = groups.get(group);
	if (!entry) return;
	entry.members.delete(id);
	if (entry.members.size > 0) return;
	if (entry.intent === "default") {
		groups.delete(group);
		listeners.delete(group);
		stateCache.delete(group);
	}
}
/**
* A reader picked a preset on one of the group's controls.
*
* `window` is resolved by the caller, which owns the preset vocabulary.
*/
function selectRangePreset(group, preset, window) {
	readGroup(group);
	return commit(group, {
		preset,
		window,
		intent: "preset"
	});
}
/**
* A reader panned or zoomed one of the group's plates.
*
* `preset` is the preset the resulting window matches, or `null` when it matches
* none -- the honest "this is a manual window" that keeps the selector from
* claiming a preset the reader is no longer on. A manual window is never
* replaced by a member's declared default.
*/
function selectRangeWindow(group, window, preset) {
	readGroup(group);
	return commit(group, {
		preset,
		window,
		intent: "manual"
	});
}
function subscribeRangeGroup(group, listener) {
	let set = listeners.get(group);
	if (!set) {
		set = /* @__PURE__ */ new Set();
		listeners.set(group, set);
	}
	set.add(listener);
	return () => {
		set.delete(listener);
		if (set.size === 0) listeners.delete(group);
	};
}
/** Test seam: forget every group (and every reader choice). */
function resetRangeGroups() {
	groups.clear();
	listeners.clear();
	stateCache.clear();
}
/** Test seam: what the store holds, including unclaimed declarations. */
function rangeGroupSnapshot(group) {
	const entry = groups.get(group);
	return {
		state: rangeGroupState(group),
		members: entry ? [...entry.members].map(([id, member]) => ({
			id,
			...member
		})) : []
	};
}
//#endregion
export { declareRangeMember, rangeGroupSnapshot, rangeGroupState, releaseRangeMember, resetRangeGroups, selectRangePreset, selectRangeWindow, subscribeRangeGroup, updateRangeMemberDomain };

//# sourceMappingURL=range-group.js.map