"use client";
import { useOptionalTheme } from "../../../providers/theme-provider.js";
import { resolveTradingViewTheme, tradingViewTokenStyle } from "./theme.js";
import { getTradingViewLoadError, getTradingViewLoadState, loadTradingViewElement, resetTradingViewLoad, subscribeTradingViewLoad } from "./loader.js";
import { getLucBridgeColorSnapshot, parseLucBridgeColorSnapshot, subscribeLucTokens } from "./tokens.js";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
//#region src/integrations/tradingview/core/use-tradingview.ts
/** The theme a widget should render in, resolved from Luc UI's theme. */
function useTradingViewTheme(theme = "auto") {
	const resolved = useOptionalTheme()?.resolvedTheme ?? "dark";
	return resolveTradingViewTheme(theme, resolved);
}
/** Theme + token style for a Web Component wrapper. */
function useTradingViewTokenBridge({ theme, inheritTheme = true, transparent }) {
	const resolvedTheme = useTradingViewTheme(theme);
	const snapshot = useSyncExternalStore(subscribeLucTokens, getLucBridgeColorSnapshot, () => "");
	const colors = useMemo(() => parseLucBridgeColorSnapshot(snapshot), [snapshot]);
	return {
		theme: resolvedTheme,
		style: useMemo(() => tradingViewTokenStyle({
			inheritTheme,
			transparent,
			colors
		}), [
			colors,
			inheritTheme,
			transparent
		])
	};
}
/**
* Lazy gate.
*
* Nothing is requested until the widget is near the viewport, so a catalog page
* with thirty previews does not open thirty connections. `eager` skips the
* observer entirely; a widget that is already visible resolves on the first
* observer callback, which is one frame after mount.
*/
function useTradingViewInView(loading = "lazy") {
	const [observed, setObserved] = useState(false);
	const ref = useRef(null);
	const supported = typeof IntersectionObserver !== "undefined";
	useEffect(() => {
		if (loading === "eager" || observed || !supported) return;
		const node = ref.current;
		if (!node) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) setObserved(true);
		}, { rootMargin: "200px" });
		observer.observe(node);
		return () => observer.disconnect();
	}, [
		loading,
		observed,
		supported
	]);
	return {
		ref,
		inView: loading === "eager" || observed || !supported
	};
}
/**
* Lifecycle for a Web Component wrapper.
*
* The store is read through `useSyncExternalStore`, so several wrappers sharing
* one module URL all observe the same transition without any context.
*/
function useTradingViewElement(options) {
	const { url, tag, active, timeoutMs } = options;
	const subscribe = useCallback((listener) => subscribeTradingViewLoad(url, listener), [url]);
	const getSnapshot = useCallback(() => getTradingViewLoadState(url), [url]);
	const storeState = useSyncExternalStore(subscribe, getSnapshot, () => "pending");
	const [tick, setTick] = useState(0);
	useEffect(() => {
		if (!active || !url) return;
		loadTradingViewElement(url, {
			tag,
			timeoutMs
		});
	}, [
		active,
		tag,
		timeoutMs,
		url,
		tick
	]);
	const retry = useCallback(() => {
		resetTradingViewLoad(url);
		setTick((value) => value + 1);
	}, [url]);
	return {
		status: !active || !url ? "idle" : storeState === "pending" ? "loading" : storeState === "failed" ? "error" : "ready",
		error: getTradingViewLoadError(url),
		retry
	};
}
/**
* Notify a caller on every lifecycle transition.
*
* The callback is kept in a ref that is written from an effect (the same
* pattern as `useLatest`), so a caller passing an inline arrow does not restart
* the load on every render.
*/
function useTradingViewStatusChange(status, error, onChange) {
	const latest = useRef(onChange);
	useEffect(() => {
		latest.current = onChange;
	});
	useEffect(() => {
		latest.current?.({
			status,
			error
		});
	}, [error, status]);
}
//#endregion
export { useTradingViewElement, useTradingViewInView, useTradingViewStatusChange, useTradingViewTheme, useTradingViewTokenBridge };

//# sourceMappingURL=use-tradingview.js.map