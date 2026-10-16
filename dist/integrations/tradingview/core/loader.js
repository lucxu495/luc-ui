import { TRADINGVIEW_MODULE_HOST, TRADINGVIEW_SCRIPT_HOST, TRADINGVIEW_WIDGET_HOST } from "./catalog.js";
//#region src/integrations/tradingview/core/loader.ts
/**
* Loader for TradingView's official widget code.
*
* Two mechanisms, because the provider ships two formats:
*
*  - **Web Components** are ES modules. We import the official module URL once
*    per URL and wait for `customElements.whenDefined`, so ten widgets on a page
*    share one download and one registration.
*  - **iframes** are built by a classic embed script that reads its own JSON
*    configuration out of `document.currentScript`. That script has to be
*    injected imperatively (React will not execute a script it renders) and
*    removed on unmount so a remount cannot stack two widgets.
*
* Security: only the two official hosts are accepted. Component props never
* reach a script URL — the URL comes from the registry.
*/
const ALLOWED_HOSTS = new Set([
	TRADINGVIEW_MODULE_HOST,
	TRADINGVIEW_SCRIPT_HOST,
	TRADINGVIEW_WIDGET_HOST
].map((host) => new URL(host).host));
/**
* Reject anything that is not an official TradingView widget URL.
*
* This is the guard that keeps a `config` escape hatch or a future prop from
* turning into `<script src={userInput}>`.
*/
function assertTradingViewUrl(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`[luc-ui] Not a TradingView widget URL: ${url}`);
	}
	if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.host)) throw new Error(`[luc-ui] Refusing to load a non-TradingView script: ${url}`);
	return parsed;
}
const records = /* @__PURE__ */ new Map();
const listeners = /* @__PURE__ */ new Map();
const inFlight = /* @__PURE__ */ new Map();
function emit(url) {
	for (const listener of listeners.get(url) ?? []) listener();
}
function setRecord(url, record) {
	records.set(url, record);
	emit(url);
}
/** Current state for a URL. `"pending"` when nothing has been requested yet. */
function getTradingViewLoadState(url) {
	return records.get(url)?.state ?? "pending";
}
function getTradingViewLoadError(url) {
	return records.get(url)?.error;
}
/** Subscribe to transitions for one URL. Returns an unsubscribe function. */
function subscribeTradingViewLoad(url, listener) {
	let set = listeners.get(url);
	if (!set) {
		set = /* @__PURE__ */ new Set();
		listeners.set(url, set);
	}
	set.add(listener);
	return () => {
		set?.delete(listener);
		if (set && set.size === 0) listeners.delete(url);
	};
}
/**
* Load an official Web Component module and wait for its element to register.
*
* Deduplicated per URL and concurrency-safe: the same URL always returns the
* same promise. `timeoutMs` reports a slow/failed registration as `"failed"`
* *without* cancelling the wait — if the element registers later the state
* still becomes `"ready"`, so a slow network recovers instead of sticking.
*/
function loadTradingViewElement(url, options) {
	const existing = inFlight.get(url);
	if (existing) return existing;
	const { tag, timeoutMs = 12e3, signal, loadModule } = options;
	const promise = (async () => {
		try {
			assertTradingViewUrl(url);
		} catch (cause) {
			setRecord(url, {
				state: "failed",
				error: cause instanceof Error ? cause : new Error(String(cause))
			});
			return;
		}
		setRecord(url, { state: "pending" });
		let settled = false;
		let timer;
		const registration = (async () => {
			if (typeof document === "undefined") return;
			const registry = window.customElements;
			if (!registry) throw new Error("[luc-ui] Custom elements are unavailable in this browser.");
			if (registry.get(tag)) return;
			try {
				if (loadModule) await loadModule(url);
				else await import(
					/* webpackIgnore: true */
					/* @vite-ignore */
					url
);
			} catch (cause) {
				throw new Error(`[luc-ui] The TradingView module failed to load: ${url}`, { cause });
			}
			await registry.whenDefined(tag);
		})();
		const timeout = new Promise((_resolve, reject) => {
			timer = setTimeout(() => {
				reject(/* @__PURE__ */ new Error(`[luc-ui] The TradingView widget "${tag}" did not register within ${timeoutMs}ms.`));
			}, timeoutMs);
		});
		try {
			await Promise.race([registration, timeout]);
			settled = true;
			setRecord(url, { state: "ready" });
			inFlight.delete(url);
		} catch (cause) {
			if (timer) clearTimeout(timer);
			const error = cause instanceof Error ? cause : new Error(String(cause));
			if (!settled) {
				setRecord(url, {
					state: "failed",
					error
				});
				registration.then(() => {
					setRecord(url, { state: "ready" });
					inFlight.delete(url);
				}).catch(() => {
					inFlight.delete(url);
				});
			}
		} finally {
			if (timer) clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
		}
	})();
	function onAbort() {
		inFlight.delete(url);
	}
	signal?.addEventListener("abort", onAbort, { once: true });
	inFlight.set(url, promise);
	return promise;
}
/**
* Forget a URL so the next attempt runs again. Used by the error surface's
* retry: the browser may still serve a cached rejection, and a timeout recovers
* immediately — both outcomes are honest and neither is hidden.
*/
function resetTradingViewLoad(url) {
	inFlight.delete(url);
	records.delete(url);
	emit(url);
}
/**
* Where a torn-down embed waits before it is really removed.
*
* A provider embed is **not** teardown-safe: its script addresses its own
* container through the running script's `parentNode`, and its callbacks keep
* addressing the iframe it created — `document.currentScript.parentNode` and
* `iframe.contentWindow` are both null the moment the nodes leave the document.
* A client-side navigation therefore produced provider-owned uncaught errors
* ("Cannot read properties of null", "contentWindow is not available") *after*
* the route had already changed.
*
* So teardown parks the provider's container in a hidden, bounded lot for a
* grace period instead of detaching it immediately: the provider finishes its
* own work against nodes that still exist, and the lot is emptied a few seconds
* later. The queue is capped so an SPA session cannot accumulate dead widgets.
*/
const TEARDOWN_LOT_ID = "luc-tv-teardown-lot";
const TEARDOWN_LOT_LIMIT = 6;
const TEARDOWN_GRACE_MS = 5e3;
const SETTLED_GRACE_MS = 600;
function parkProviderContainer(container, graceMs = TEARDOWN_GRACE_MS) {
	if (typeof document === "undefined" || !document.body) {
		container.replaceChildren();
		return;
	}
	let lot = document.getElementById(TEARDOWN_LOT_ID);
	if (!lot) {
		lot = document.createElement("div");
		lot.id = TEARDOWN_LOT_ID;
		lot.setAttribute("aria-hidden", "true");
		lot.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";
		document.body.append(lot);
	}
	lot.append(container);
	while (lot.childElementCount > TEARDOWN_LOT_LIMIT) lot.firstElementChild?.remove();
	window.setTimeout(() => {
		container.replaceChildren();
		container.remove();
		if (lot && lot.childElementCount === 0) lot.remove();
	}, graceMs);
}
/**
* Inject an official iframe embed script into `target`'s container.
*
* Mirrors the provider's own snippet exactly: the script carries the JSON
* configuration as its text content, and the provider replaces it with an
* iframe. The script is re-created whenever the configuration changes, and on
* destroy its container is parked (see above) and then removed — which is what
* keeps React StrictMode's double mount from stacking two widgets.
*/
function createTradingViewEmbed(options) {
	const { container, target, config, onError } = options;
	let settled = false;
	let resolveReady = () => {};
	let rejectReady = () => {};
	const ready = new Promise((resolve, reject) => {
		resolveReady = resolve;
		rejectReady = reject;
	});
	ready.catch(() => {});
	let parsed;
	try {
		parsed = assertTradingViewUrl(options.scriptUrl);
	} catch (cause) {
		const error = cause instanceof Error ? cause : new Error(String(cause));
		settled = true;
		rejectReady(error);
		onError?.(error);
		return {
			script: document.createElement("script"),
			target,
			ready,
			destroy: () => container.replaceChildren()
		};
	}
	const script = document.createElement("script");
	script.type = "text/javascript";
	script.src = parsed.href;
	script.async = true;
	script.setAttribute("async", "");
	script.textContent = JSON.stringify(config);
	script.addEventListener("load", () => {
		settled = true;
		resolveReady();
	});
	script.addEventListener("error", () => {
		settled = true;
		const error = /* @__PURE__ */ new Error(`[luc-ui] The TradingView embed script failed to load: ${parsed.href}`);
		rejectReady(error);
		onError?.(error);
	});
	container.appendChild(script);
	return {
		script,
		target,
		ready,
		destroy: () => {
			if (!settled) rejectReady(/* @__PURE__ */ new Error("[luc-ui] The TradingView embed was cancelled before it loaded."));
			parkProviderContainer(container, settled ? SETTLED_GRACE_MS : TEARDOWN_GRACE_MS);
		}
	};
}
//#endregion
export { assertTradingViewUrl, createTradingViewEmbed, getTradingViewLoadError, getTradingViewLoadState, loadTradingViewElement, resetTradingViewLoad, subscribeTradingViewLoad };

//# sourceMappingURL=loader.js.map