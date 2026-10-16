"use client";
import { decodeParams, patchParams, searchToString } from "./params.js";
import { createBrowserUrlStateAdapter } from "./adapter.js";
import { useCallback, useMemo, useSyncExternalStore } from "react";
//#region src/url-state/use-url-state.ts
/**
* Bind one parameter set to the address bar, with no framework in the loop.
*
* Reading goes through `useSyncExternalStore`, so Back and Forward are picked up
* without a re-render loop, and the server snapshot is the `initialSearch` the
* caller passed — there is no address bar on a server, so there must be no
* address-bar-derived markup in the first HTML either.
*/
function useUrlState(specs, options = {}) {
	const { history = "replace", initialSearch = "" } = options;
	const adapter = useMemo(() => options.adapter ?? createBrowserUrlStateAdapter({ initialSearch }), []);
	const subscribe = useCallback((onChange) => adapter.subscribe(onChange), [adapter]);
	const getSnapshot = useCallback(() => adapter.getSearch(), [adapter]);
	const getServerSnapshot = useCallback(() => initialSearch, [initialSearch]);
	const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	return [useMemo(() => decodeParams(search, specs), [search, specs]), useCallback((patch, setOptions) => {
		const next = patchParams(adapter.getSearch(), specs, patch);
		adapter.setSearch(searchToString(next), { replace: setOptions?.replace ?? history === "replace" });
	}, [
		adapter,
		history,
		specs
	])];
}
//#endregion
export { useUrlState };

//# sourceMappingURL=use-url-state.js.map