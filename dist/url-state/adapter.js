//#region src/url-state/adapter.ts
/**
* A history-API adapter with no framework attached.
*
* It is SSR-safe: on the server every method is inert and `getSearch` returns
* the supplied `initialSearch`, so the first client render matches the server.
*/
function createBrowserUrlStateAdapter(options = {}) {
	const { initialSearch = "" } = options;
	return {
		getSearch: () => typeof window === "undefined" ? initialSearch : window.location.search,
		setSearch: (search, { replace }) => {
			if (typeof window === "undefined") return;
			const url = `${window.location.pathname}${search}${window.location.hash}`;
			if (replace) window.history.replaceState(window.history.state, "", url);
			else window.history.pushState(window.history.state, "", url);
			window.dispatchEvent(new PopStateEvent("popstate"));
		},
		subscribe: (onChange) => {
			if (typeof window === "undefined") return () => {};
			window.addEventListener("popstate", onChange);
			return () => window.removeEventListener("popstate", onChange);
		}
	};
}
//#endregion
export { createBrowserUrlStateAdapter };

//# sourceMappingURL=adapter.js.map