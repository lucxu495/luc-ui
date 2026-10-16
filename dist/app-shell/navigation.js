//#region src/app-shell/navigation.ts
/** Normalise a pathname so `/research/` and `/research` compare equal. */
function normalizePathname(pathname) {
	if (!pathname) return "/";
	const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
	if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
	return withoutQuery === "" ? "/" : withoutQuery;
}
/**
* Is `href` the current location?
*
* A prefix only counts on a path *segment* boundary, so `/charts` is active on
* `/charts/timeseries` but not on `/charts-archive`.
*/
function isNavigationItemActive(pathname, href) {
	if (!href) return false;
	const current = normalizePathname(pathname ?? "");
	const target = normalizePathname(href);
	if (target === "/") return current === "/";
	return current === target || current.startsWith(`${target}/`);
}
/**
* Is this item the *page the reader is on*, rather than a section containing it?
*
* `isNavigationItemActive` lights a section while a detail page is open, which
* is what a sidebar map should do. `aria-current="page"` is a stronger claim:
* exactly one navigation link may make it, so this is the exact-match test.
*/
function isNavigationItemCurrent(pathname, href) {
	if (!href) return false;
	return normalizePathname(pathname ?? "") === normalizePathname(href);
}
/**
* The most specific active ancestor in a tree — the item a sidebar should
* highlight when the current route is a detail page.
*/
function findActiveNavigationItem(groups, pathname) {
	let match;
	let matchLength = -1;
	for (const group of groups) for (const item of group.items) for (const candidate of [item, ...item.children ?? []]) {
		if (!isNavigationItemActive(pathname, candidate.href)) continue;
		const length = normalizePathname(candidate.href ?? "").length;
		if (length > matchLength) {
			match = candidate;
			matchLength = length;
		}
	}
	return match;
}
/** Flatten a tree depth-first, preserving order. */
function flattenNavigation(groups) {
	const out = [];
	const visit = (items) => {
		for (const item of items) {
			out.push(item);
			if (item.children) visit(item.children);
		}
	};
	for (const group of groups) visit(group.items);
	return out;
}
/**
* Turn the navigation model into command-palette entries.
*
* This is the shared-metadata rule: the palette does not keep its own copy of
* the routes. A product adds command-only rows by passing `extras`.
*/
function navigationCommandEntries(groups, extras = []) {
	const entries = [];
	for (const group of groups) for (const item of flattenNavigation([{
		id: group.id,
		label: group.label,
		items: group.items
	}])) {
		if (!item.href) continue;
		entries.push(toEntry(item, group.label));
	}
	for (const item of extras) entries.push(toEntry(item));
	return entries;
}
function toEntry(item, groupLabel) {
	return {
		id: item.id,
		label: item.label,
		href: item.href,
		description: item.description,
		groupLabel,
		action: item.action,
		disabled: item.disabled,
		haystack: [
			item.label,
			item.description,
			groupLabel,
			...item.keywords ?? []
		].filter(Boolean).join(" ").toLowerCase()
	};
}
/**
* Case-insensitive filter across a navigation tree.
*
* A parent survives when any of its children match, so a search for a nested
* page never hides the path to it.
*/
function filterNavigation(groups, query) {
	const needle = query.trim().toLowerCase();
	if (!needle) return groups;
	const matches = (item) => [
		item.label,
		item.description,
		...item.keywords ?? []
	].filter(Boolean).join(" ").toLowerCase().includes(needle);
	return groups.map((group) => {
		const items = [];
		for (const item of group.items) {
			const children = item.children?.filter(matches);
			if (matches(item) || children && children.length > 0) items.push({
				...item,
				children: children && children.length > 0 ? children : void 0
			});
		}
		return {
			...group,
			items
		};
	}).filter((group) => group.items.length > 0);
}
//#endregion
export { filterNavigation, findActiveNavigationItem, flattenNavigation, isNavigationItemActive, isNavigationItemCurrent, navigationCommandEntries, normalizePathname };

//# sourceMappingURL=navigation.js.map